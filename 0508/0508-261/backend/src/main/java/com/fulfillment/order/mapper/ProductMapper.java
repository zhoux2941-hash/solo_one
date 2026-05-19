package com.fulfillment.order.mapper;

import com.fulfillment.order.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ProductMapper {
    Product selectById(@Param("id") Long id);

    int deductStock(@Param("id") Long id, @Param("quantity") Integer quantity, @Param("version") Integer version);

    int deductStockAtomic(@Param("id") Long id, @Param("quantity") Integer quantity);

    Integer selectStockById(@Param("id") Long id);

    int rollbackStock(@Param("id") Long id, @Param("quantity") Integer quantity);
}