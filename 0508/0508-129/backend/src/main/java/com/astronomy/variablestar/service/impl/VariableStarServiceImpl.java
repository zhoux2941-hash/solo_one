package com.astronomy.variablestar.service.impl;

import com.astronomy.variablestar.dto.StarDetailDTO;
import com.astronomy.variablestar.entity.ReferenceStar;
import com.astronomy.variablestar.entity.VariableStar;
import com.astronomy.variablestar.repository.ReferenceStarRepository;
import com.astronomy.variablestar.repository.VariableStarRepository;
import com.astronomy.variablestar.service.VariableStarService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VariableStarServiceImpl implements VariableStarService {

    private final VariableStarRepository variableStarRepository;
    private final ReferenceStarRepository referenceStarRepository;

    @Override
    public List<VariableStar> getAllStars() {
        return variableStarRepository.findAll();
    }

    @Override
    public List<VariableStar> getStarsByType(String starType) {
        return variableStarRepository.findByStarType(starType);
    }

    @Override
    public List<VariableStar> getStarsByConstellation(String constellation) {
        return variableStarRepository.findByConstellation(constellation);
    }

    @Override
    public StarDetailDTO getStarDetail(Long starId) {
        VariableStar star = variableStarRepository.findById(starId)
            .orElseThrow(() -> new RuntimeException("变星不存在，ID: " + starId));
        
        List<ReferenceStar> referenceStars = 
            referenceStarRepository.findByVariableStarIdOrderBySequenceOrderAsc(starId);

        StarDetailDTO dto = new StarDetailDTO();
        dto.setVariableStar(star);
        dto.setReferenceStars(referenceStars);
        
        return dto;
    }

    @Override
    public List<String> getAllStarTypes() {
        return variableStarRepository.findDistinctStarTypes();
    }

    @Override
    public List<String> getAllConstellations() {
        return variableStarRepository.findDistinctConstellations();
    }
}
