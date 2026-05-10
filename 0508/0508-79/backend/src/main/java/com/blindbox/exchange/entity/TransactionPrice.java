package com.blindbox.exchange.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transaction_prices")
public class TransactionPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "box_id", nullable = false)
    private BlindBox box;

    @Column(nullable = false, length = 100)
    private String seriesName;

    @Column(nullable = false, length = 100)
    private String styleName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exchange_request_id")
    private ExchangeRequest exchangeRequest;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (transactionDate == null) {
            transactionDate = LocalDate.now();
        }
        createdAt = LocalDateTime.now();
    }
}
