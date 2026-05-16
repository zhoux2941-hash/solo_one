package com.voting.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "vote_records", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"poll_id", "ip_address", "nickname", "option_id"})
})
public class VoteRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    @JsonIgnore
    private Poll poll;

    @Column(name = "option_id", nullable = false)
    private Long optionId;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @Column(nullable = false)
    private LocalDateTime votedAt = LocalDateTime.now();
}
