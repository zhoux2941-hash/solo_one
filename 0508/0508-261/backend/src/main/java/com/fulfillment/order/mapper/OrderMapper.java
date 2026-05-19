package com.fulfillment.order.mapper;

import com.fulfillment.order.dto.OrderQueryDTO;
import com.fulfillment.order.entity.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface OrderMapper {
    int insert(Order order);

    Order selectByOrderNo(@Param("orderNo") String orderNo);

    Order selectById(@Param("id") Long id);

    List<Order> selectList(OrderQueryDTO query);

    List<Order> selectListByCursor(@Param("orderNo") String orderNo,
                                    @Param("userId") Long userId,
                                    @Param("status") String status,
                                    @Param("lastId") Long lastId,
                                    @Param("pageSize") Integer pageSize);

    Long selectCount(OrderQueryDTO query);

    int updateStatus(@Param("id") Long id, @Param("status") String status);

    int updatePaymentStatus(@Param("id") Long id, @Param("status") String status, @Param("paymentTime") LocalDateTime paymentTime);

    int updateShipStatus(@Param("id") Long id, @Param("status") String status, @Param("shipTime") LocalDateTime shipTime);

    int updateDeliveryStatus(@Param("id") Long id, @Param("status") String status, @Param("deliveryTime") LocalDateTime deliveryTime);

    int updateCancelStatus(@Param("id") Long id, @Param("status") String status, @Param("cancelTime") LocalDateTime cancelTime, @Param("cancelReason") String cancelReason);

    int updateCancelStatusWithCondition(@Param("id") Long id, @Param("newStatus") String newStatus,
                                        @Param("expectStatus") String expectStatus, @Param("cancelTime") LocalDateTime cancelTime,
                                        @Param("cancelReason") String cancelReason);

    List<Order> selectTimeoutOrders(@Param("timeoutMinutes") Integer timeoutMinutes);
}