package com.navmate.graph;

import com.navmate.common.BaseEntity;
import com.navmate.floor.Floor;
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
@Table(name = "edges")
public class Edge extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_node_id", nullable = false)
    private Node fromNode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_node_id", nullable = false)
    private Node toNode;

    @Column(nullable = false)
    private double distanceMeters;

    @Column(nullable = false)
    private boolean accessible = true;

    @Column(nullable = false)
    private double anchorCoverageScore;

    @Column(nullable = false)
    private double hazardWeight;
}
