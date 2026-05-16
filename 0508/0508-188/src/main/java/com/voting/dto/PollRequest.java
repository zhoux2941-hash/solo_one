package com.voting.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PollRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotEmpty(message = "选项列表不能为空")
    private List<String> options;

    @NotNull(message = "请选择是否允许多选")
    private Boolean allowMultiple;

    @NotNull(message = "截止时间不能为空")
    private LocalDateTime deadline;
}
