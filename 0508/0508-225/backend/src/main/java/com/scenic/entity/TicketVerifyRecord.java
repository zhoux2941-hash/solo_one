package com.scenic.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ticket_verify_record")
public class TicketVerifyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String ticketCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ticket_type_id")
    private TicketType ticketType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resource_id")
    private BusinessResource resource;

    @Column(length = 100)
    private String visitorName;

    @Column(length = 20)
    private String visitorPhone;

    @Column(length = 20)
    private String verifyChannel = "扫码";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operator_id")
    private Employee operator;

    @Column(length = 500)
    private String remark;

    @Column(updatable = false)
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
