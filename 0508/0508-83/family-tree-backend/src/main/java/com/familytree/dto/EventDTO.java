package com.familytree.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class EventDTO {
    private Long id;

    @NotBlank(message = "事件标题不能为空")
    @Size(max = 100, message = "事件标题长度不能超过100个字符")
    private String title;

    @NotNull(message = "年份不能为空")
    private Integer year;

    private Integer month;
    private Integer day;

    @Size(max = 50, message = "事件类型长度不能超过50个字符")
    private String type;

    private String description;

    @Size(max = 500, message = "地点长度不能超过500个字符")
    private String location;

    @NotNull(message = "人员ID不能为空")
    private Long personId;
}
