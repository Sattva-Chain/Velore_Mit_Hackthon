package com.navmate.admin;

import com.navmate.api.ApiDtos.BuildingSummary;
import com.navmate.api.ApiDtos.FloorStatusView;
import com.navmate.api.ApiDtos.PublishFloorResponse;
import com.navmate.building.Building;
import com.navmate.building.BuildingRepository;
import com.navmate.building.Landmark;
import com.navmate.building.LandmarkRepository;
import com.navmate.floor.Floor;
import com.navmate.floor.FloorRepository;
import com.navmate.graph.EdgeRepository;
import com.navmate.graph.NodeRepository;
import com.navmate.qr.QrAnchor;
import com.navmate.qr.QrAnchorRepository;
import com.navmate.routestate.RouteStateService;
import com.navmate.common.NavMateEnums.FloorPublishStatus;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminOnboardingService {

    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;
    private final QrAnchorRepository qrAnchorRepository;
    private final LandmarkRepository landmarkRepository;
    private final RouteStateService routeStateService;

    @Transactional
    public Building createBuilding(String code, String name, String address, boolean accessibleByDefault) {
        Building building = new Building();
        building.setCode(code);
        building.setName(name);
        building.setAddress(address);
        building.setAccessibleByDefault(accessibleByDefault);
        return buildingRepository.save(building);
    }

    @Transactional
    public Floor createFloor(UUID buildingId, String code, String name, int levelIndex, String floorPlanUrl) {
        var building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new EntityNotFoundException("Building not found: " + buildingId));
        Floor floor = new Floor();
        floor.setBuilding(building);
        floor.setCode(code);
        floor.setName(name);
        floor.setLevelIndex(levelIndex);
        floor.setFloorPlanUrl(floorPlanUrl);
        floor.setPublishStatus(FloorPublishStatus.DRAFT);
        return floorRepository.save(floor);
    }

    @Transactional
    public QrAnchor createAnchor(Floor floor, com.navmate.graph.Node node, String token, String label,
                                 boolean entranceAnchor, boolean active) {
        QrAnchor anchor = new QrAnchor();
        anchor.setFloor(floor);
        anchor.setNode(node);
        anchor.setToken(token);
        anchor.setLabel(label);
        anchor.setEntranceAnchor(entranceAnchor);
        anchor.setActive(active);
        return qrAnchorRepository.save(anchor);
    }

    @Transactional
    public Landmark createLandmark(Floor floor, com.navmate.graph.Node node, String title, String spokenHint) {
        Landmark landmark = new Landmark();
        landmark.setFloor(floor);
        landmark.setNode(node);
        landmark.setTitle(title);
        landmark.setSpokenHint(spokenHint);
        return landmarkRepository.save(landmark);
    }

    @Transactional
    public PublishFloorResponse publishFloor(UUID floorId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new EntityNotFoundException("Floor not found: " + floorId));
        List<String> checks = readinessChecks(floorId);
        if (checks.stream().anyMatch(check -> check.startsWith("FAIL"))) {
            floor.setPublishStatus(FloorPublishStatus.DRAFT);
        } else {
            floor.setPublishStatus(FloorPublishStatus.PUBLISHED);
        }
        floorRepository.save(floor);
        return new PublishFloorResponse(floor.getId(), floor.getPublishStatus().name(), checks);
    }

    public List<String> readinessChecks(UUID floorId) {
        var checks = new ArrayList<String>();
        long nodeCount = nodeRepository.findByFloorId(floorId).size();
        long edgeCount = edgeRepository.findByFloorId(floorId).size();
        long anchorCount = qrAnchorRepository.countByFloorIdAndActiveTrue(floorId);
        checks.add(nodeCount > 0 ? "PASS: floor has nodes" : "FAIL: floor has no nodes");
        checks.add(edgeCount > 0 ? "PASS: floor has edges" : "FAIL: floor has no edges");
        checks.add(anchorCount >= 2 ? "PASS: anchor coverage present" : "FAIL: insufficient active anchor coverage");
        return checks;
    }

    @Transactional(readOnly = true)
    public AdminDashboardViewModel dashboard() {
        return new AdminDashboardViewModel(
                buildingRepository.findAll().stream()
                        .map(b -> new BuildingSummary(b.getId(), b.getCode(), b.getName(), b.getAddress()))
                        .toList(),
                floorRepository.findAll().stream()
                        .map(f -> new FloorStatusView(
                                f.getId(),
                                f.getBuilding().getName(),
                                f.getName(),
                                f.getPublishStatus().name(),
                                nodeRepository.findByFloorId(f.getId()).size(),
                                edgeRepository.findByFloorId(f.getId()).size(),
                                qrAnchorRepository.findByFloorId(f.getId()).size()))
                        .toList(),
                floorRepository.findAll().stream()
                        .flatMap(f -> routeStateService.getActiveEventSummaries(f.getId()).stream())
                        .toList()
        );
    }

    public record AdminDashboardViewModel(
            List<BuildingSummary> buildings,
            List<FloorStatusView> floors,
            List<com.navmate.api.ApiDtos.RouteStateSummary> recentRouteStateEvents
    ) {}
}
