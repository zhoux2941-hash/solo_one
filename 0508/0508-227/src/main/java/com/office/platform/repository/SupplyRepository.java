package com.office.platform.repository;

import com.office.platform.entity.Supply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplyRepository extends JpaRepository<Supply, Long> {

    List<Supply> findByCategory(String category);

    @Query("SELECT s FROM Supply s WHERE s.quantity <= s.minWarning")
    List<Supply> findLowStockSupplies();

    @Query("SELECT COUNT(s) FROM Supply s WHERE s.quantity <= s.minWarning")
    long countLowStockSupplies();
}
