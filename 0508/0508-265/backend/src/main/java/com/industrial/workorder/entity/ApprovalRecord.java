package com.industrial.workorder.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "approval_record")
public class ApprovalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long workOrderId;

    @Column(nullable = false)
    private Integer approvalLevel;

    @Column(nullable = false)
    private Long approverId;

    @Transient
    private String approverName;

    @Column(nullable = false, length = 20)
    private String approvalResult;

    @Column(length = 500)
    private String comment;

    private LocalDateTime approvalTime;

    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        if (approvalTime == null) {
            approvalTime = LocalDateTime.now();
        }
    }
}
