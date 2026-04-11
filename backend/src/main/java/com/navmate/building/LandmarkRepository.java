package com.navmate.building;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LandmarkRepository extends JpaRepository<Landmark, UUID> {
    List<Landmark> findByFloorId(UUID floorId);
}
