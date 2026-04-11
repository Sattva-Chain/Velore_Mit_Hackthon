package com.navmate.api;

import com.navmate.common.NavMateEnums.ConfidenceLevel;
import com.navmate.common.NavMateEnums.NodeType;
import com.navmate.common.NavMateEnums.RouteStateType;
import com.navmate.common.NavMateEnums.SessionStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ApiDtos {

    private ApiDtos() {
    }

    public record BuildingSummary(UUID id, String code, String name, String address) {}

    public record DestinationSummary(UUID nodeId, String alias, String category, String nodeName) {}

    public record RouteStateSummary(UUID id, RouteStateType eventType, String message, Instant activeFrom,
                                    Instant activeUntil, boolean accessibleImpact, int severity) {}

    public record NavigationStartRequest(@NotBlank String anchorToken, Boolean accessibleOnly) {}

    public record DestinationRequest(@NotNull UUID destinationNodeId) {}

    public record ProgressRequest(@NotNull ConfidenceLevel confidenceLevel,
                                  @Min(0) @Max(200) int estimatedDeltaMeters) {}

    public record AnchorScanRequest(@NotBlank String anchorToken) {}

    public record RecoveryRequest(@NotBlank String reason) {}

    public record NavigationInstruction(String text, double distanceMeters, String maneuver, UUID targetNodeId) {}

    public record NavigationSessionResponse(
            UUID sessionId,
            SessionStatus status,
            ConfidenceLevel confidence,
            boolean recoveryMode,
            String voicePrompt,
            UUID buildingId,
            String buildingName,
            UUID floorId,
            String floorName,
            UUID currentNodeId,
            String currentNodeName,
            UUID destinationNodeId,
            String destinationNodeName,
            List<NavigationInstruction> instructions
    ) {}

    public record CreateBuildingRequest(@NotBlank String code, @NotBlank String name, @NotBlank String address,
                                        Boolean accessibleByDefault) {}

    public record CreateFloorRequest(@NotBlank String code, @NotBlank String name, @NotNull Integer levelIndex,
                                     String floorPlanUrl) {}

    public record CreateAnchorRequest(@NotNull UUID floorId, @NotNull UUID nodeId, @NotBlank String token,
                                      @NotBlank String label, Boolean entranceAnchor, Boolean active) {}

    public record CreateLandmarkRequest(@NotNull UUID floorId, @NotNull UUID nodeId, @NotBlank String title,
                                        @NotBlank String spokenHint) {}

    public record CreateRouteStateRequest(@NotNull UUID floorId, UUID edgeId, UUID nodeId,
                                          @NotNull RouteStateType eventType, @NotBlank String message,
                                          Instant activeFrom, Instant activeUntil,
                                          Boolean accessibleImpact, @Min(1) @Max(5) Integer severity,
                                          @NotBlank String createdBy) {}

    public record PublishFloorResponse(UUID floorId, String publishStatus, List<String> readinessChecks) {}

    public record GraphImportRequest(
            @NotBlank String floorCode,
            @NotBlank String floorName,
            @Valid @NotEmpty List<GraphNodeInput> nodes,
            @Valid @NotEmpty List<GraphEdgeInput> edges,
            @Valid List<GraphAnchorInput> anchors,
            @Valid List<GraphLandmarkInput> landmarks,
            @Valid List<GraphDestinationAliasInput> destinationAliases
    ) {}

    public record GraphUpdateRequest(@Valid @NotEmpty List<GraphNodeInput> nodes,
                                     @Valid @NotEmpty List<GraphEdgeInput> edges) {}

    public record GraphNodeInput(@NotBlank String code, @NotBlank String name, @NotNull NodeType type,
                                 double xMeters, double yMeters, boolean accessible,
                                 boolean entrance, boolean helpDesk, boolean lift) {}

    public record GraphEdgeInput(@NotBlank String from, @NotBlank String to,
                                 @Positive double distanceMeters, boolean accessible,
                                 double anchorCoverageScore, double hazardWeight) {}

    public record GraphAnchorInput(@NotBlank String token, @NotBlank String label, @NotBlank String nodeCode,
                                   boolean entranceAnchor, boolean active) {}

    public record GraphLandmarkInput(@NotBlank String title, @NotBlank String spokenHint, @NotBlank String nodeCode) {}

    public record GraphDestinationAliasInput(@NotBlank String alias, @NotBlank String category,
                                             @NotBlank String nodeCode) {}

    public record AdminDashboardView(
            List<BuildingSummary> buildings,
            List<FloorStatusView> floors,
            List<RouteStateSummary> recentRouteStateEvents
    ) {}

    public record FloorStatusView(UUID floorId, String buildingName, String floorName, String publishStatus,
                                  long nodeCount, long edgeCount, long anchorCount) {}
}
