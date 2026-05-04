package com.loganalysis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 日志上传请求 DTO
 */
@Data
public class LogUploadRequest {

    /**
     * 日志类型
     */
    @NotBlank(message = "日志类型不能为空")
    private String logType;

    /**
     * 解析规则 ID（可选，使用自定义规则时需要）
     */
    private Long parseRuleId;

    /**
     * 来源标识（可选，如文件名）
     */
    private String source;
}
