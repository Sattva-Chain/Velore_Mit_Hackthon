package com.navmate.recovery;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecoveryEventRepository extends JpaRepository<RecoveryEvent, UUID> {
    List<RecoveryEvent> findBySessionId(UUID sessionId);
}
