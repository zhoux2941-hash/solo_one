package com.autorepair.service;

import com.autorepair.entity.Part;
import com.autorepair.repository.PartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PartService {
    @Autowired
    private PartRepository partRepository;
    
    public List<Part> list() {
        return partRepository.findAll();
    }
    
    public List<Part> search(String keyword) {
        return partRepository.findByNameContainingOrPartNoContaining(keyword, keyword);
    }
    
    public List<Part> getWarningStock() {
        return partRepository.findByStockLessThanEqual(10);
    }
    
    public Part getById(Long id) {
        Optional<Part> optional = partRepository.findById(id);
        return optional.orElse(null);
    }
    
    public Part save(Part part) {
        if (part.getStock() == null) {
            part.setStock(0);
        }
        return partRepository.save(part);
    }
    
    @Transactional
    public Part stockIn(Long id, Integer quantity) {
        Part part = getById(id);
        if (part != null) {
            part.setStock(part.getStock() + quantity);
            return partRepository.save(part);
        }
        return null;
    }
    
    @Transactional
    public Part stockOut(Long id, Integer quantity) {
        Part part = getById(id);
        if (part != null && part.getStock() >= quantity) {
            part.setStock(part.getStock() - quantity);
            return partRepository.save(part);
        }
        throw new RuntimeException("库存不足");
    }
    
    public void delete(Long id) {
        partRepository.deleteById(id);
    }
}