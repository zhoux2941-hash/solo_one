package com.astronomy.variablestar.dto;

import com.astronomy.variablestar.entity.ReferenceStar;
import com.astronomy.variablestar.entity.VariableStar;
import lombok.Data;

import java.util.List;

@Data
public class StarDetailDTO {

    private VariableStar variableStar;
    private List<ReferenceStar> referenceStars;
}
