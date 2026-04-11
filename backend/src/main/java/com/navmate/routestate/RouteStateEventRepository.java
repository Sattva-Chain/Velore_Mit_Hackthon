package com.navmate.routestate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteStateEventRepository extends JpaRepository<RouteStateEvent, UUID> {
    List<RouteStateEvent> findByFloorIdAndActiveFromBefore(UUID floorId, Instant now);
}
