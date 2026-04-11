package com.navmate.building;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DestinationAliasRepository extends JpaRepository<DestinationAlias, UUID> {
    List<DestinationAlias> findByBuildingIdOrderByAliasAsc(UUID buildingId);
}
