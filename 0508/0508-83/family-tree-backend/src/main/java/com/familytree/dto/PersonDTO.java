package com.familytree.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class PersonDTO {
    private Long id;

    @NotBlank(message = "姓名不能为空")
    @Size(max = 100, message = "姓名长度不能超过100个字符")
    private String name;

    @NotBlank(message = "性别不能为空")
    private String gender;

    private Integer birthYear;
    private Integer deathYear;
    private String biography;
    private String avatar;

    private Long fatherId;
    private Long motherId;
    private Long spouseId;
}
