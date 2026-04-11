package com.navmate.graph;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EdgeRepository extends JpaRepository<Edge, UUID> {
    List<Edge> findByFloorId(UUID floorId);
}
