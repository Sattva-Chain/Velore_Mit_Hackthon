package com.navmate.graph;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NodeRepository extends JpaRepository<Node, UUID> {
    List<Node> findByFloorId(UUID floorId);
    Optional<Node> findByFloorIdAndCode(UUID floorId, String code);
    List<Node> findByFloorBuildingIdAndHelpDeskTrue(UUID buildingId);
}
