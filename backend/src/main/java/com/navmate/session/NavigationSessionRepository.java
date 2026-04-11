package com.navmate.session;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NavigationSessionRepository extends JpaRepository<NavigationSession, UUID> {
}
