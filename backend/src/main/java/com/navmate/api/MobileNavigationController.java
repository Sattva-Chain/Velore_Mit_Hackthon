package com.navmate.api;

import com.navmate.api.ApiDtos.AnchorScanRequest;
import com.navmate.api.ApiDtos.DestinationRequest;
import com.navmate.api.ApiDtos.NavigationSessionResponse;
import com.navmate.api.ApiDtos.NavigationStartRequest;
import com.navmate.api.ApiDtos.ProgressRequest;
import com.navmate.api.ApiDtos.RecoveryRequest;
import com.navmate.recovery.RecoveryService;
import com.navmate.session.SessionService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/navigation")
@RequiredArgsConstructor
public class MobileNavigationController {

    private final SessionService sessionService;
    private final RecoveryService recoveryService;

    @PostMapping("/start")
    public NavigationSessionResponse start(@Valid @RequestBody NavigationStartRequest request) {
        return sessionService.start(request.anchorToken(), request.accessibleOnly() == null || request.accessibleOnly());
    }

    @PostMapping("/{sessionId}/destination")
    public NavigationSessionResponse chooseDestination(@PathVariable UUID sessionId,
                                                       @Valid @RequestBody DestinationRequest request) {
        return sessionService.selectDestination(sessionId, request.destinationNodeId());
    }

    @PostMapping("/{sessionId}/progress")
    public NavigationSessionResponse progress(@PathVariable UUID sessionId,
                                              @Valid @RequestBody ProgressRequest request) {
        return sessionService.updateProgress(sessionId, request.confidenceLevel(), request.estimatedDeltaMeters());
    }

    @PostMapping("/{sessionId}/anchor")
    public NavigationSessionResponse anchor(@PathVariable UUID sessionId,
                                            @Valid @RequestBody AnchorScanRequest request) {
        return sessionService.anchor(sessionId, request.anchorToken());
    }

    @PostMapping("/{sessionId}/recovery")
    public NavigationSessionResponse recovery(@PathVariable UUID sessionId,
                                              @Valid @RequestBody RecoveryRequest request) {
        return recoveryService.recover(sessionId, request.reason());
    }

    @GetMapping("/{sessionId}")
    public NavigationSessionResponse session(@PathVariable UUID sessionId) {
        return sessionService.currentState(sessionId);
    }
}
