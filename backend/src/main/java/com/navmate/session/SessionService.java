package com.navmate.session;

import com.navmate.api.ApiDtos.NavigationSessionResponse;
import com.navmate.common.NavMateEnums.ConfidenceLevel;
import com.navmate.common.NavMateEnums.SessionStatus;
import com.navmate.graph.Node;
import com.navmate.graph.NodeRepository;
import com.navmate.qr.AnchorService;
import com.navmate.qr.QrAnchor;
import com.navmate.routing.RoutingService;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final NavigationSessionRepository navigationSessionRepository;
    private final AnchorService anchorService;
    private final NodeRepository nodeRepository;
    private final RoutingService routingService;

    @Transactional
    public NavigationSessionResponse start(String anchorToken, boolean accessibleOnly) {
        QrAnchor anchor = anchorService.resolve(anchorToken);
        NavigationSession session = new NavigationSession();
        session.setBuilding(anchor.getFloor().getBuilding());
        session.setFloor(anchor.getFloor());
        session.setStartAnchor(anchor);
        session.setCurrentNode(anchor.getNode());
        session.setStatus(SessionStatus.SELECTING_DESTINATION);
        session.setConfidenceLevel(ConfidenceLevel.HIGH);
        session.setAccessibleOnly(accessibleOnly);
        session.setRecoveryMode(false);
        session.setVoiceState("Main entrance confirmed. Where would you like to go?");
        session.setStartedAt(Instant.now());
        session.setSessionUpdatedAt(Instant.now());
        navigationSessionRepository.save(session);
        return toResponse(session, List.of());
    }

    @Transactional
    public NavigationSessionResponse selectDestination(UUID sessionId, UUID destinationNodeId) {
        NavigationSession session = getEntity(sessionId);
        Node destination = nodeRepository.findById(destinationNodeId)
                .orElseThrow(() -> new EntityNotFoundException("Destination not found: " + destinationNodeId));
        session.setDestinationNode(destination);
        session.setStatus(SessionStatus.NAVIGATING);
        session.setRecoveryMode(false);
        session.setVoiceState("Walk straight for 8 meters.");
        session.setSessionUpdatedAt(Instant.now());
        navigationSessionRepository.save(session);
        var routePlan = routingService.computeRoute(session.getFloor().getId(), session.getCurrentNode(), destination,
                session.isAccessibleOnly(), false);
        return toResponse(session, routePlan.instructions());
    }

    @Transactional
    public NavigationSessionResponse updateProgress(UUID sessionId, ConfidenceLevel confidenceLevel, int estimatedDeltaMeters) {
        NavigationSession session = getEntity(sessionId);
        session.setConfidenceLevel(confidenceLevel);
        session.setSessionUpdatedAt(Instant.now());
        if (confidenceLevel == ConfidenceLevel.LOW) {
            session.setStatus(SessionStatus.RECOVERING);
            session.setRecoveryMode(true);
            session.setVoiceState("I have lost your precise position. Keep walking slowly. I will reacquire at the next marker.");
        } else if (session.getDestinationNode() != null) {
            session.setStatus(SessionStatus.NAVIGATING);
            session.setVoiceState("Position confirmed. Continue straight for 10 meters.");
        }
        // TODO: use IMU-calibrated dead reckoning per device profile rather than simple confidence transitions.
        navigationSessionRepository.save(session);
        return currentState(sessionId);
    }

    @Transactional
    public NavigationSessionResponse anchor(UUID sessionId, String anchorToken) {
        NavigationSession session = getEntity(sessionId);
        QrAnchor anchor = anchorService.resolve(anchorToken);
        session.setCurrentNode(anchor.getNode());
        session.setConfidenceLevel(ConfidenceLevel.HIGH);
        session.setRecoveryMode(false);
        session.setStatus(session.getDestinationNode() == null ? SessionStatus.SELECTING_DESTINATION : SessionStatus.NAVIGATING);
        session.setVoiceState("Position confirmed. Continue straight for 10 meters.");
        session.setSessionUpdatedAt(Instant.now());
        navigationSessionRepository.save(session);
        return currentState(sessionId);
    }

    @Transactional(readOnly = true)
    public NavigationSessionResponse currentState(UUID sessionId) {
        NavigationSession session = getEntity(sessionId);
        List<com.navmate.api.ApiDtos.NavigationInstruction> instructions = List.of();
        if (session.getDestinationNode() != null) {
            instructions = routingService.computeRoute(session.getFloor().getId(), session.getCurrentNode(),
                    session.getDestinationNode(), session.isAccessibleOnly(), session.isRecoveryMode()).instructions();
        }
        if (session.getDestinationNode() != null && session.getCurrentNode() != null
                && session.getCurrentNode().getId().equals(session.getDestinationNode().getId())) {
            session.setStatus(SessionStatus.ARRIVED);
            session.setVoiceState("You have arrived.");
        }
        return toResponse(session, instructions);
    }

    public NavigationSession getEntity(UUID sessionId) {
        return navigationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Navigation session not found: " + sessionId));
    }

    private NavigationSessionResponse toResponse(NavigationSession session,
                                                 List<com.navmate.api.ApiDtos.NavigationInstruction> instructions) {
        return new NavigationSessionResponse(
                session.getId(),
                session.getStatus(),
                session.getConfidenceLevel(),
                session.isRecoveryMode(),
                session.getVoiceState(),
                session.getBuilding().getId(),
                session.getBuilding().getName(),
                session.getFloor().getId(),
                session.getFloor().getName(),
                session.getCurrentNode() != null ? session.getCurrentNode().getId() : null,
                session.getCurrentNode() != null ? session.getCurrentNode().getName() : null,
                session.getDestinationNode() != null ? session.getDestinationNode().getId() : null,
                session.getDestinationNode() != null ? session.getDestinationNode().getName() : null,
                instructions
        );
    }
}
