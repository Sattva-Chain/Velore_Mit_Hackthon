package com.navmate.recovery;

import com.navmate.common.BaseEntity;
import com.navmate.graph.Node;
import com.navmate.session.NavigationSession;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "recovery_events")
public class RecoveryEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private NavigationSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_node_id")
    private Node fromNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_node_id")
    private Node recommendedNode;

    @Column(nullable = false, length = 160)
    private String reason;

    @Column(nullable = false, length = 255)
    private String actionSuggested;

    @Column(nullable = false)
    private Instant occurredAt;

    @Column
    private Instant resolvedAt;
}
