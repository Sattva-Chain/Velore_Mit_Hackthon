package com.navmate.auth;

import com.navmate.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "admin_users")
public class AdminUser extends BaseEntity {

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(nullable = false, length = 160)
    private String displayName;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 64)
    private String role;

    @Column(nullable = false)
    private boolean active = true;
}
