package com.property.maintenance.repository;

import com.property.maintenance.entity.SparePart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    @Modifying
    @Query("UPDATE SparePart s SET s.lockedQuantity = s.lockedQuantity + :quantity WHERE s.id = :id AND s.stockQuantity - s.lockedQuantity >= :quantity")
    int lockStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    @Modifying
    @Query("UPDATE SparePart s SET s.lockedQuantity = s.lockedQuantity - :quantity WHERE s.id = :id")
    int unlockStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    @Modifying
    @Query("UPDATE SparePart s SET s.stockQuantity = s.stockQuantity - :quantity, s.lockedQuantity = s.lockedQuantity - :quantity WHERE s.id = :id")
    int deductStock(@Param("id") Long id, @Param("quantity") Integer quantity);
}
