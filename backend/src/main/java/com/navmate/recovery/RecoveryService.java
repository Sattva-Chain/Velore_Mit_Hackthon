package com.navmate.recovery;

import com.navmate.api.ApiDtos.NavigationInstruction;
import com.navmate.api.ApiDtos.NavigationSessionResponse;
import com.navmate.common.NavMateEnums.SessionStatus;
import com.navmate.graph.Node;
import com.navmate.graph.NodeRepository;
import com.navmate.session.NavigationSession;
import com.navmate.session.SessionService;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecoveryService {

    private final SessionService sessionService;
    private final RecoveryEventRepository recoveryEventRepository;
    private final NodeRepository nodeRepository;

    @Transactional
    public NavigationSessionResponse recover(java.util.UUID sessionId, String reason) {
        NavigationSession session = sessionService.getEntity(sessionId);
        Node recommended = recommendRecoveryNode(session);
        RecoveryEvent event = new RecoveryEvent();
        event.setSession(session);
        event.setFromNode(session.getCurrentNode());
        event.setRecommendedNode(recommended);
        event.setReason(reason);
        event.setActionSuggested(recommended != null
                ? "Attempt QR re-anchor near " + recommended.getName()
                : "Return to last confirmed point");
        event.setOccurredAt(Instant.now());
        recoveryEventRepository.save(event);

        session.setRecoveryMode(true);
        session.setStatus(SessionStatus.RECOVERING);
        session.setVoiceState(recommended != null
                ? "I have lost your precise position. Keep walking slowly. I will reacquire at the next marker."
                : "Please return to your last confirmed point or ask for nearby help.");
        var current = sessionService.currentState(sessionId);
        return new NavigationSessionResponse(
                current.sessionId(),
                current.status(),
                current.confidence(),
                true,
                session.getVoiceState(),
                current.buildingId(),
                current.buildingName(),
                current.floorId(),
                current.floorName(),
                current.currentNodeId(),
                current.currentNodeName(),
                current.destinationNodeId(),
                current.destinationNodeName(),
                recommended != null
                        ? List.of(new NavigationInstruction("Move toward " + recommended.getName() + " for re-anchoring.", 0.0, "recover", recommended.getId()))
                        : current.instructions()
        );
    }

    private Node recommendRecoveryNode(NavigationSession session) {
        if (session.getCurrentNode() != null) {
            return session.getCurrentNode();
        }
        return nodeRepository.findByFloorBuildingIdAndHelpDeskTrue(session.getBuilding().getId()).stream().findFirst().orElse(null);
    }
}
