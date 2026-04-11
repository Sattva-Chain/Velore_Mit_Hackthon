package com.navmate.floor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorRepository extends JpaRepository<Floor, UUID> {
    List<Floor> findByBuildingId(UUID buildingId);
    Optional<Floor> findByBuildingIdAndCode(UUID buildingId, String code);
}
