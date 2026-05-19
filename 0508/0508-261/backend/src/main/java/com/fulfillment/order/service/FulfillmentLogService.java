package com.fulfillment.order.service;

import com.fulfillment.order.entity.FulfillmentLog;
import com.fulfillment.order.mapper.FulfillmentLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FulfillmentLogService {

    private final FulfillmentLogMapper fulfillmentLogMapper;

    public void saveLog(String orderNo, Long userId, String operationType, String operationDesc,
                        String operator, String beforeStatus, String afterStatus) {
        FulfillmentLog log = new FulfillmentLog();
        log.setOrderNo(orderNo);
        log.setUserId(userId);
        log.setOperationType(operationType);
        log.setOperationDesc(operationDesc);
        log.setOperator(operator);
        log.setBeforeStatus(beforeStatus);
        log.setAfterStatus(afterStatus);
        fulfillmentLogMapper.insert(log);
    }

    public List<FulfillmentLog> getLogsByOrderNo(String orderNo) {
        return fulfillmentLogMapper.selectByOrderNo(orderNo);
    }

    public List<FulfillmentLog> getLogsByUserId(Long userId) {
        return fulfillmentLogMapper.selectByUserId(userId);
    }
}