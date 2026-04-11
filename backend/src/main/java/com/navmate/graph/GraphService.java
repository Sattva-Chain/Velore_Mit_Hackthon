package com.navmate.graph;

import com.navmate.api.ApiDtos.GraphAnchorInput;
import com.navmate.api.ApiDtos.GraphDestinationAliasInput;
import com.navmate.api.ApiDtos.GraphImportRequest;
import com.navmate.api.ApiDtos.GraphLandmarkInput;
import com.navmate.api.ApiDtos.GraphNodeInput;
import com.navmate.api.ApiDtos.GraphUpdateRequest;
import com.navmate.building.Building;
import com.navmate.building.DestinationAlias;
import com.navmate.building.DestinationAliasRepository;
import com.navmate.building.Landmark;
import com.navmate.building.LandmarkRepository;
import com.navmate.floor.Floor;
import com.navmate.floor.FloorRepository;
import com.navmate.qr.QrAnchor;
import com.navmate.qr.QrAnchorRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GraphService {

    private final FloorRepository floorRepository;
    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;
    private final QrAnchorRepository qrAnchorRepository;
    private final LandmarkRepository landmarkRepository;
    private final DestinationAliasRepository destinationAliasRepository;

    @Transactional
    public void importGraph(UUID floorId, GraphImportRequest request) {
        var floor = loadFloor(floorId);
        floor.setCode(request.floorCode());
        floor.setName(request.floorName());
        floorRepository.save(floor);
        replaceGraph(floor, request.nodes(), request.edges(), request.anchors(), request.landmarks(), request.destinationAliases());
    }

    @Transactional
    public void updateGraph(UUID floorId, GraphUpdateRequest request) {
        var floor = loadFloor(floorId);
        var existingAnchors = qrAnchorRepository.findByFloorId(floorId).stream()
                .map(anchor -> new GraphAnchorInput(anchor.getToken(), anchor.getLabel(), anchor.getNode().getCode(),
                        anchor.isEntranceAnchor(), anchor.isActive()))
                .toList();
        var existingLandmarks = landmarkRepository.findByFloorId(floorId).stream()
                .map(landmark -> new GraphLandmarkInput(landmark.getTitle(), landmark.getSpokenHint(), landmark.getNode().getCode()))
                .toList();
        var existingAliases = destinationAliasRepository.findByBuildingIdOrderByAliasAsc(floor.getBuilding().getId()).stream()
                .filter(alias -> alias.getNode().getFloor().getId().equals(floorId))
                .map(alias -> new GraphDestinationAliasInput(alias.getAlias(), alias.getCategory(), alias.getNode().getCode()))
                .toList();
        replaceGraph(floor, request.nodes(), request.edges(), existingAnchors, existingLandmarks, existingAliases);
    }

    public List<Node> getNodes(UUID floorId) {
        return nodeRepository.findByFloorId(floorId);
    }

    public List<Edge> getEdges(UUID floorId) {
        return edgeRepository.findByFloorId(floorId);
    }

    private Floor loadFloor(UUID floorId) {
        return floorRepository.findById(floorId)
                .orElseThrow(() -> new EntityNotFoundException("Floor not found: " + floorId));
    }

    private void replaceGraph(Floor floor,
                              List<GraphNodeInput> nodes,
                              List<com.navmate.api.ApiDtos.GraphEdgeInput> edges,
                              List<GraphAnchorInput> anchors,
                              List<GraphLandmarkInput> landmarks,
                              List<GraphDestinationAliasInput> destinationAliases) {
        edgeRepository.deleteAll(edgeRepository.findByFloorId(floor.getId()));
        qrAnchorRepository.deleteAll(qrAnchorRepository.findByFloorId(floor.getId()));
        landmarkRepository.deleteAll(landmarkRepository.findByFloorId(floor.getId()));
        nodeRepository.deleteAll(nodeRepository.findByFloorId(floor.getId()));
        destinationAliasRepository.deleteAll(destinationAliasRepository.findByBuildingIdOrderByAliasAsc(floor.getBuilding().getId()));

        Map<String, Node> nodeByCode = new HashMap<>();
        for (var input : nodes) {
            var node = new Node();
            node.setFloor(floor);
            node.setCode(input.code());
            node.setName(input.name());
            node.setType(input.type());
            node.setXMeters(input.xMeters());
            node.setYMeters(input.yMeters());
            node.setAccessible(input.accessible());
            node.setEntrance(input.entrance());
            node.setHelpDesk(input.helpDesk());
            node.setLift(input.lift());
            nodeRepository.save(node);
            nodeByCode.put(node.getCode(), node);
        }

        for (var input : edges) {
            var fromNode = requireNode(nodeByCode, input.from());
            var toNode = requireNode(nodeByCode, input.to());
            var edge = new Edge();
            edge.setFloor(floor);
            edge.setFromNode(fromNode);
            edge.setToNode(toNode);
            edge.setDistanceMeters(input.distanceMeters());
            edge.setAccessible(input.accessible());
            edge.setAnchorCoverageScore(input.anchorCoverageScore());
            edge.setHazardWeight(input.hazardWeight());
            edgeRepository.save(edge);
        }

        for (var input : anchors) {
            var anchor = new QrAnchor();
            anchor.setFloor(floor);
            anchor.setNode(requireNode(nodeByCode, input.nodeCode()));
            anchor.setToken(input.token());
            anchor.setLabel(input.label());
            anchor.setEntranceAnchor(input.entranceAnchor());
            anchor.setActive(input.active());
            qrAnchorRepository.save(anchor);
        }

        for (var input : landmarks) {
            var landmark = new Landmark();
            landmark.setFloor(floor);
            landmark.setNode(requireNode(nodeByCode, input.nodeCode()));
            landmark.setTitle(input.title());
            landmark.setSpokenHint(input.spokenHint());
            landmarkRepository.save(landmark);
        }

        Building building = floor.getBuilding();
        for (var input : destinationAliases) {
            var alias = new DestinationAlias();
            alias.setBuilding(building);
            alias.setNode(requireNode(nodeByCode, input.nodeCode()));
            alias.setAlias(input.alias());
            alias.setCategory(input.category());
            destinationAliasRepository.save(alias);
        }
    }

    private Node requireNode(Map<String, Node> nodeByCode, String code) {
        var node = nodeByCode.get(code);
        if (node == null) {
            throw new IllegalArgumentException("Unknown node code in graph import: " + code);
        }
        return node;
    }
}
