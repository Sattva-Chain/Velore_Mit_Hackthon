package com.navmate.qr;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QrAnchorRepository extends JpaRepository<QrAnchor, UUID> {
    Optional<QrAnchor> findByTokenAndActiveTrue(String token);
    List<QrAnchor> findByFloorId(UUID floorId);
    long countByFloorIdAndActiveTrue(UUID floorId);
}
