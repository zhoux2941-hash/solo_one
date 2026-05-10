package com.volunteer.repository;

import com.volunteer.entity.Goods;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GoodsRepository extends JpaRepository<Goods, Long> {
    List<Goods> findByStatusOrderByCreateTimeDesc(String status);
    List<Goods> findByStatusAndIsHotOrderByCreateTimeDesc(String status, Boolean isHot);
    
    @Modifying
    @Query("UPDATE Goods g SET g.stock = g.stock - :quantity WHERE g.id = :id AND g.stock >= :quantity")
    int decreaseStock(@Param("id") Long id, @Param("quantity") Integer quantity);
    
    @Modifying
    @Query("UPDATE Goods g SET g.stock = g.stock + :quantity WHERE g.id = :id")
    int increaseStock(@Param("id") Long id, @Param("quantity") Integer quantity);
}
