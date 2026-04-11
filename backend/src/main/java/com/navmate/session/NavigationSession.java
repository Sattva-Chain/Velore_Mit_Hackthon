package com.navmate.session;

import com.navmate.building.Building;
import com.navmate.common.BaseEntity;
import com.navmate.common.NavMateEnums.ConfidenceLevel;
import com.navmate.common.NavMateEnums.SessionStatus;
import com.navmate.floor.Floor;
import com.navmate.graph.Node;
import com.navmate.qr.QrAnchor;
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
@Table(name = "navigation_sessions")
public class NavigationSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "start_anchor_id")
    private QrAnchor startAnchor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_node_id")
    private Node currentNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_node_id")
    private Node destinationNode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SessionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ConfidenceLevel confidenceLevel;

    @Column(nullable = false)
    private boolean accessibleOnly = true;

    @Column(nullable = false)
    private boolean recoveryMode;

    @Column(nullable = false, length = 255)
    private String voiceState;

    @Column(nullable = false)
    private Instant startedAt;

    @Column(nullable = false)
    private Instant sessionUpdatedAt;
}
