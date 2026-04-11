package com.navmate.api;

import com.navmate.api.ApiDtos.DestinationSummary;
import com.navmate.api.ApiDtos.RouteStateSummary;
import com.navmate.building.DestinationAliasRepository;
import com.navmate.routestate.RouteStateService;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final DestinationAliasRepository destinationAliasRepository;
    private final RouteStateService routeStateService;

    @GetMapping("/{buildingId}/destinations")
    @Transactional(readOnly = true)
    public List<DestinationSummary> destinations(@PathVariable UUID buildingId) {
        return destinationAliasRepository.findByBuildingIdOrderByAliasAsc(buildingId).stream()
                .map(alias -> new DestinationSummary(alias.getNode().getId(), alias.getAlias(), alias.getCategory(), alias.getNode().getName()))
                .toList();
    }

    @GetMapping("/{buildingId}/state")
    @Transactional(readOnly = true)
    public List<RouteStateSummary> buildingState(@PathVariable UUID buildingId) {
        var destinations = destinationAliasRepository.findByBuildingIdOrderByAliasAsc(buildingId);
        var floor = destinations.stream().findFirst()
                .map(alias -> alias.getNode().getFloor())
                .orElseThrow(() -> new EntityNotFoundException("No floor state found for building " + buildingId));
        return routeStateService.getActiveEventSummaries(floor.getId());
    }
}
