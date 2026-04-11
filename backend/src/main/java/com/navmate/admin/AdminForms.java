package com.navmate.admin;

import lombok.Getter;
import lombok.Setter;

public final class AdminForms {

    private AdminForms() {
    }

    @Getter
    @Setter
    public static class BuildingForm {
        private String code = "";
        private String name = "";
        private String address = "";
        private Boolean accessibleByDefault = true;
    }

    @Getter
    @Setter
    public static class FloorForm {
        private String code = "";
        private String name = "";
        private Integer levelIndex = 0;
        private String floorPlanUrl = "";
    }
}
