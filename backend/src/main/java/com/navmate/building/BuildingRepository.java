package com.navmate.building;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BuildingRepository extends JpaRepository<Building, UUID> {
    Optional<Building> findByCode(String code);
}
