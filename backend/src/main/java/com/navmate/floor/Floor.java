package com.navmate.floor;

import com.navmate.building.Building;
import com.navmate.common.BaseEntity;
import com.navmate.common.NavMateEnums.FloorPublishStatus;
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
@Table(name = "floors")
public class Floor extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false)
    private Integer levelIndex;

    @Column(length = 255)
    private String floorPlanUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FloorPublishStatus publishStatus = FloorPublishStatus.DRAFT;
}
