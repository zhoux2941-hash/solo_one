package com.fulfillment.order.mapper;

import com.fulfillment.order.entity.FulfillmentLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FulfillmentLogMapper {
    int insert(FulfillmentLog log);

    List<FulfillmentLog> selectByOrderNo(@Param("orderNo") String orderNo);

    List<FulfillmentLog> selectByUserId(@Param("userId") Long userId);
}