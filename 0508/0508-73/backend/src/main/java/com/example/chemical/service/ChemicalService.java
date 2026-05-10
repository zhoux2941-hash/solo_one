package com.example.chemical.service;

import com.example.chemical.entity.Chemical;
import com.example.chemical.repository.ChemicalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ChemicalService {

    @Autowired
    private ChemicalRepository chemicalRepository;

    public List<Chemical> getAllChemicals() {
        return chemicalRepository.findAll();
    }

    public Optional<Chemical> getChemicalById(Long id) {
        return chemicalRepository.findById(id);
    }

    public Chemical createChemical(Chemical chemical) {
        return chemicalRepository.save(chemical);
    }

    @Transactional
    public Chemical updateChemical(Long id, Chemical chemicalDetails) {
        return chemicalRepository.findById(id).map(chemical -> {
            chemical.setName(chemicalDetails.getName());
            chemical.setCasNumber(chemicalDetails.getCasNumber());
            chemical.setCurrentStock(chemicalDetails.getCurrentStock());
            chemical.setUnit(chemicalDetails.getUnit());
            chemical.setDangerLevel(chemicalDetails.getDangerLevel());
            return chemicalRepository.save(chemical);
        }).orElse(null);
    }
}
