package com.navmate.admin;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminPageController {

    private final AdminOnboardingService adminOnboardingService;

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("dashboard", adminOnboardingService.dashboard());
        model.addAttribute("buildingForm", new AdminForms.BuildingForm());
        return "admin/dashboard";
    }

    @PostMapping("/buildings")
    public String submitBuilding(@ModelAttribute("buildingForm") AdminForms.BuildingForm request) {
        adminOnboardingService.createBuilding(request.getCode(), request.getName(), request.getAddress(),
                request.getAccessibleByDefault() == null || request.getAccessibleByDefault());
        return "redirect:/admin";
    }

    @GetMapping("/floors/{buildingId}")
    public String floorForm(@PathVariable UUID buildingId, Model model) {
        model.addAttribute("buildingId", buildingId);
        model.addAttribute("floorForm", new AdminForms.FloorForm());
        return "admin/floor-form";
    }

    @PostMapping("/floors/{buildingId}")
    public String submitFloor(@PathVariable UUID buildingId, @ModelAttribute("floorForm") AdminForms.FloorForm request) {
        adminOnboardingService.createFloor(buildingId, request.getCode(), request.getName(), request.getLevelIndex(), request.getFloorPlanUrl());
        return "redirect:/admin";
    }
}
