package com.oms.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long parentId;

    @Column(nullable = false)
    private String permissionName;

    @Column(unique = true, nullable = false)
    private String permissionCode;

    @Enumerated(EnumType.STRING)
    private PermissionType type;

    private String path;

    private String component;

    private String icon;

    private Integer sortOrder;

    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    private Set<Role> roles = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum PermissionType {
        MENU, BUTTON, API
    }
}
