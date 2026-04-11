package com.navmate.qr;

import com.navmate.common.BaseEntity;
import com.navmate.floor.Floor;
import com.navmate.graph.Node;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "qr_anchors")
public class QrAnchor extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "node_id", nullable = false)
    private Node node;

    @Column(nullable = false, unique = true, length = 128)
    private String token;

    @Column(nullable = false, length = 160)
    private String label;

    @Column(nullable = false)
    private boolean entranceAnchor;

    @Column(nullable = false)
    private boolean active = true;
}
