package com.navmate.common;

public final class NavMateEnums {

    private NavMateEnums() {
    }

    public enum NodeType {
        ENTRANCE,
        INTERSECTION,
        CORRIDOR,
        ROOM,
        HELP_DESK,
        LIFT,
        STAIRS
    }

    public enum ConfidenceLevel {
        HIGH,
        MEDIUM,
        LOW
    }

    public enum SessionStatus {
        IDLE,
        SCANNING_ENTRANCE,
        SELECTING_DESTINATION,
        NAVIGATING,
        RECOVERING,
        ARRIVED
    }

    public enum FloorPublishStatus {
        DRAFT,
        READY,
        PUBLISHED
    }

    public enum RouteStateType {
        BLOCKED,
        ACCESSIBILITY_LIMITED,
        CAUTION
    }
}
