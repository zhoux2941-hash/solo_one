package com.fulfillment.order.mapper;

import com.fulfillment.order.entity.OrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OrderItemMapper {
    int insert(OrderItem orderItem);

    int batchInsert(@Param("items") List<OrderItem> items);

    List<OrderItem> selectByOrderId(@Param("orderId") Long orderId);

    List<OrderItem> selectByOrderNo(@Param("orderNo") String orderNo);
}