package com.military.equipment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("operation_log")
public class OperationLog {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long userId;
    private String username;
    private String realName;
    private String operationModule;
    private String operationType;
    private String operationDesc;
    private String requestMethod;
    private String requestUrl;
    private String requestParams;
    private String responseResult;
    private String ipAddress;
    private Long executeTime;
    private Integer operationStatus;
    private String errorMsg;
    private LocalDateTime createdTime;
}
