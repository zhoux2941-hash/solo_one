package com.astronomy.variablestar.service;

import com.astronomy.variablestar.dto.StarDetailDTO;
import com.astronomy.variablestar.entity.VariableStar;

import java.util.List;

public interface VariableStarService {

    List<VariableStar> getAllStars();

    List<VariableStar> getStarsByType(String starType);

    List<VariableStar> getStarsByConstellation(String constellation);

    StarDetailDTO getStarDetail(Long starId);

    List<String> getAllStarTypes();

    List<String> getAllConstellations();
}
