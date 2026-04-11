package com.navmate.routestate;

import com.navmate.api.ApiDtos.RouteStateSummary;
import com.navmate.common.NavMateEnums.RouteStateType;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RouteStateService {

    private final RouteStateEventRepository routeStateEventRepository;

    public RouteStateEvent create(RouteStateEvent event) {
        if (event.getActiveFrom() == null) {
            event.setActiveFrom(Instant.now());
        }
        if (event.getSeverity() <= 0) {
            event.setSeverity(3);
        }
        return routeStateEventRepository.save(event);
    }

    public List<RouteStateEvent> getActiveEvents(UUID floorId) {
        var now = Instant.now();
        return routeStateEventRepository.findByFloorIdAndActiveFromBefore(floorId, now).stream()
                .filter(event -> event.getActiveUntil() == null || event.getActiveUntil().isAfter(now))
                .toList();
    }

    public List<RouteStateSummary> getActiveEventSummaries(UUID floorId) {
        return getActiveEvents(floorId).stream()
                .map(this::toSummary)
                .toList();
    }

    public RouteStateEvent getById(UUID id) {
        return routeStateEventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Route state event not found: " + id));
    }

    private RouteStateSummary toSummary(RouteStateEvent event) {
        return new RouteStateSummary(
                event.getId(),
                event.getEventType(),
                event.getMessage(),
                event.getActiveFrom(),
                event.getActiveUntil(),
                event.isAccessibleImpact(),
                event.getSeverity()
        );
    }

    public boolean blocksEdge(RouteStateEvent event) {
        return event.getEventType() == RouteStateType.BLOCKED && event.getEdge() != null;
    }
}
