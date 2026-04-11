package com.navmate.routestate;

import com.navmate.common.BaseEntity;
import com.navmate.common.NavMateEnums.RouteStateType;
import com.navmate.floor.Floor;
import com.navmate.graph.Edge;
import com.navmate.graph.Node;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "route_state_events")
public class RouteStateEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edge_id")
    private Edge edge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id")
    private Node node;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RouteStateType eventType;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(nullable = false)
    private Instant activeFrom;

    @Column
    private Instant activeUntil;

    @Column(nullable = false)
    private boolean accessibleImpact;

    @Column(nullable = false)
    private int severity;

    @Column(nullable = false, length = 160)
    private String createdBy;
}
