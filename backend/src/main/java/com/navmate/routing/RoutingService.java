package com.navmate.routing;

import com.navmate.api.ApiDtos.NavigationInstruction;
import com.navmate.graph.Edge;
import com.navmate.graph.EdgeRepository;
import com.navmate.graph.Node;
import com.navmate.routestate.RouteStateService;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoutingService {

    private final EdgeRepository edgeRepository;
    private final RouteStateService routeStateService;

    @Value("${navmate.routing.anchor-coverage-preference-weight:2.0}")
    private double anchorCoveragePreferenceWeight;

    @Value("${navmate.routing.recovery-safety-weight:3.0}")
    private double recoverySafetyWeight;

    public RoutePlan computeRoute(UUID floorId, Node start, Node destination, boolean accessibleOnly, boolean recoveryMode) {
        List<Edge> allEdges = edgeRepository.findByFloorId(floorId);
        var activeEvents = routeStateService.getActiveEvents(floorId);
        Set<UUID> blockedEdges = new HashSet<>();
        Set<UUID> blockedNodes = new HashSet<>();
        Set<UUID> cautionEdges = new HashSet<>();

        activeEvents.forEach(event -> {
            if (event.getEdge() != null && event.getEventType().name().equals("BLOCKED")) {
                blockedEdges.add(event.getEdge().getId());
            }
            if (event.getNode() != null && event.getEventType().name().equals("BLOCKED")) {
                blockedNodes.add(event.getNode().getId());
            }
            if (event.getEdge() != null && !event.getEventType().name().equals("BLOCKED")) {
                cautionEdges.add(event.getEdge().getId());
            }
        });

        Map<UUID, List<Edge>> adjacency = new HashMap<>();
        for (Edge edge : allEdges) {
            adjacency.computeIfAbsent(edge.getFromNode().getId(), key -> new ArrayList<>()).add(edge);
            adjacency.computeIfAbsent(edge.getToNode().getId(), key -> new ArrayList<>()).add(reverseEdge(edge));
        }

        Map<UUID, Double> distances = new HashMap<>();
        Map<UUID, Edge> previous = new HashMap<>();
        PriorityQueue<RouteCandidate> queue = new PriorityQueue<>(Comparator.comparingDouble(RouteCandidate::score));
        distances.put(start.getId(), 0.0);
        queue.add(new RouteCandidate(start.getId(), 0.0));

        while (!queue.isEmpty()) {
            var current = queue.poll();
            if (current.nodeId().equals(destination.getId())) {
                break;
            }
            if (current.score() > distances.getOrDefault(current.nodeId(), Double.MAX_VALUE)) {
                continue;
            }
            for (Edge edge : adjacency.getOrDefault(current.nodeId(), List.of())) {
                if (blockedEdges.contains(edge.getId()) || blockedNodes.contains(edge.getToNode().getId())) {
                    continue;
                }
                if (accessibleOnly && !edge.isAccessible()) {
                    continue;
                }
                double score = edge.getDistanceMeters();
                score += edge.getHazardWeight();
                score -= edge.getAnchorCoverageScore() * anchorCoveragePreferenceWeight;
                if (cautionEdges.contains(edge.getId()) || recoveryMode) {
                    score += edge.getHazardWeight() * recoverySafetyWeight;
                }
                double next = current.score() + Math.max(score, 0.5);
                if (next < distances.getOrDefault(edge.getToNode().getId(), Double.MAX_VALUE)) {
                    distances.put(edge.getToNode().getId(), next);
                    previous.put(edge.getToNode().getId(), edge);
                    queue.add(new RouteCandidate(edge.getToNode().getId(), next));
                }
            }
        }

        if (!previous.containsKey(destination.getId()) && !start.getId().equals(destination.getId())) {
            throw new IllegalArgumentException("No route available for current route state");
        }

        ArrayDeque<Edge> stack = new ArrayDeque<>();
        UUID cursor = destination.getId();
        while (!cursor.equals(start.getId())) {
            Edge edge = previous.get(cursor);
            if (edge == null) {
                break;
            }
            stack.push(edge);
            cursor = edge.getFromNode().getId();
        }
        List<Edge> path = new ArrayList<>(stack);
        List<NavigationInstruction> instructions = toInstructions(path);
        return new RoutePlan(path, instructions);
    }

    private List<NavigationInstruction> toInstructions(List<Edge> path) {
        if (path.isEmpty()) {
            return List.of(new NavigationInstruction("You have arrived.", 0.0, "arrive", null));
        }
        List<NavigationInstruction> instructions = new ArrayList<>();
        for (int i = 0; i < path.size(); i++) {
            Edge edge = path.get(i);
            String text = i == 0
                    ? "Walk straight for " + (int) Math.round(edge.getDistanceMeters()) + " meters."
                    : "Continue for " + (int) Math.round(edge.getDistanceMeters()) + " meters.";
            if (i == path.size() - 1) {
                text = text + " Destination ahead.";
            }
            instructions.add(new NavigationInstruction(text, edge.getDistanceMeters(), "straight", edge.getToNode().getId()));
        }
        return instructions;
    }

    private Edge reverseEdge(Edge edge) {
        Edge reversed = new Edge();
        reversed.setId(edge.getId());
        reversed.setFloor(edge.getFloor());
        reversed.setFromNode(edge.getToNode());
        reversed.setToNode(edge.getFromNode());
        reversed.setDistanceMeters(edge.getDistanceMeters());
        reversed.setAccessible(edge.isAccessible());
        reversed.setAnchorCoverageScore(edge.getAnchorCoverageScore());
        reversed.setHazardWeight(edge.getHazardWeight());
        return reversed;
    }

    private record RouteCandidate(UUID nodeId, double score) {}

    public record RoutePlan(List<Edge> edges, List<NavigationInstruction> instructions) {}
}
