package com.navmate.api;

import com.navmate.admin.AdminOnboardingService;
import com.navmate.api.ApiDtos.CreateAnchorRequest;
import com.navmate.api.ApiDtos.CreateBuildingRequest;
import com.navmate.api.ApiDtos.CreateFloorRequest;
import com.navmate.api.ApiDtos.CreateLandmarkRequest;
import com.navmate.api.ApiDtos.CreateRouteStateRequest;
import com.navmate.api.ApiDtos.GraphImportRequest;
import com.navmate.api.ApiDtos.GraphUpdateRequest;
import com.navmate.api.ApiDtos.PublishFloorResponse;
import com.navmate.building.BuildingRepository;
import com.navmate.floor.FloorRepository;
import com.navmate.graph.GraphService;
import com.navmate.graph.NodeRepository;
import com.navmate.routestate.RouteStateEvent;
import com.navmate.routestate.RouteStateService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminApiController {

    private final AdminOnboardingService adminOnboardingService;
    private final GraphService graphService;
    private final FloorRepository floorRepository;
    private final NodeRepository nodeRepository;
    private final RouteStateService routeStateService;

    @PostMapping("/buildings")
    public Map<String, Object> createBuilding(@Valid @RequestBody CreateBuildingRequest request) {
        var building = adminOnboardingService.createBuilding(
                request.code(),
                request.name(),
                request.address(),
                request.accessibleByDefault() == null || request.accessibleByDefault());
        return Map.of("id", building.getId(), "name", building.getName());
    }

    @PostMapping("/buildings/{id}/floors")
    public Map<String, Object> createFloor(@PathVariable UUID id, @Valid @RequestBody CreateFloorRequest request) {
        var floor = adminOnboardingService.createFloor(id, request.code(), request.name(), request.levelIndex(), request.floorPlanUrl());
        return Map.of("id", floor.getId(), "name", floor.getName());
    }

    @PostMapping("/floors/{id}/graph/import")
    public Map<String, String> importGraph(@PathVariable UUID id, @Valid @RequestBody GraphImportRequest request) {
        graphService.importGraph(id, request);
        return Map.of("status", "imported");
    }

    @PutMapping("/floors/{id}/graph")
    public Map<String, String> updateGraph(@PathVariable UUID id, @Valid @RequestBody GraphUpdateRequest request) {
        graphService.updateGraph(id, request);
        return Map.of("status", "updated");
    }

    @PostMapping("/anchors")
    public Map<String, Object> createAnchor(@Valid @RequestBody CreateAnchorRequest request) {
        var floor = floorRepository.findById(request.floorId())
                .orElseThrow(() -> new EntityNotFoundException("Floor not found: " + request.floorId()));
        var node = nodeRepository.findById(request.nodeId())
                .orElseThrow(() -> new EntityNotFoundException("Node not found: " + request.nodeId()));
        var anchor = adminOnboardingService.createAnchor(floor, node, request.token(), request.label(),
                request.entranceAnchor() != null && request.entranceAnchor(),
                request.active() == null || request.active());
        return Map.of("id", anchor.getId(), "token", anchor.getToken());
    }

    @PostMapping("/landmarks")
    public Map<String, Object> createLandmark(@Valid @RequestBody CreateLandmarkRequest request) {
        var floor = floorRepository.findById(request.floorId())
                .orElseThrow(() -> new EntityNotFoundException("Floor not found: " + request.floorId()));
        var node = nodeRepository.findById(request.nodeId())
                .orElseThrow(() -> new EntityNotFoundException("Node not found: " + request.nodeId()));
        var landmark = adminOnboardingService.createLandmark(floor, node, request.title(), request.spokenHint());
        return Map.of("id", landmark.getId(), "title", landmark.getTitle());
    }

    @PostMapping("/route-state")
    public Map<String, Object> createRouteState(@Valid @RequestBody CreateRouteStateRequest request) {
        var floor = floorRepository.findById(request.floorId())
                .orElseThrow(() -> new EntityNotFoundException("Floor not found: " + request.floorId()));
        var event = new RouteStateEvent();
        event.setFloor(floor);
        if (request.edgeId() != null) {
            var edge = graphService.getEdges(request.floorId()).stream()
                    .filter(candidate -> candidate.getId().equals(request.edgeId()))
                    .findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("Edge not found: " + request.edgeId()));
            event.setEdge(edge);
        }
        if (request.nodeId() != null) {
            var node = nodeRepository.findById(request.nodeId())
                    .orElseThrow(() -> new EntityNotFoundException("Node not found: " + request.nodeId()));
            event.setNode(node);
        }
        event.setEventType(request.eventType());
        event.setMessage(request.message());
        event.setActiveFrom(request.activeFrom() == null ? Instant.now() : request.activeFrom());
        event.setActiveUntil(request.activeUntil());
        event.setAccessibleImpact(request.accessibleImpact() != null && request.accessibleImpact());
        event.setSeverity(request.severity() == null ? 3 : request.severity());
        event.setCreatedBy(request.createdBy());
        var saved = routeStateService.create(event);
        return Map.of("id", saved.getId(), "message", saved.getMessage());
    }

    @PostMapping("/publish/{floorId}")
    public PublishFloorResponse publish(@PathVariable UUID floorId) {
        return adminOnboardingService.publishFloor(floorId);
    }
}
