package com.quiz.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class CreateCompetitionRequest {
    @NotBlank
    private String name;

    private String description;

    @NotEmpty
    private List<Long> categoryIds;

    @Min(value = 1)
    private Integer questionCount;

    @Min(value = 2)
    @Max(value = 4)
    private Integer teamCount;

    @NotEmpty
    private List<String> teamNames;
}
