package com.navmate.graph;

import com.navmate.common.BaseEntity;
import com.navmate.common.NavMateEnums.NodeType;
import com.navmate.floor.Floor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "nodes")
public class Node extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NodeType type;

    @Column(nullable = false)
    private double xMeters;

    @Column(nullable = false)
    private double yMeters;

    @Column(nullable = false)
    private boolean accessible = true;

    @Column(nullable = false)
    private boolean entrance;

    @Column(nullable = false)
    private boolean helpDesk;

    @Column(nullable = false)
    private boolean lift;
}
