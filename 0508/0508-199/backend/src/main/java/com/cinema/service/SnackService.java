package com.cinema.service;

import com.cinema.entity.Snack;
import com.cinema.repository.SnackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SnackService {
    
    @Autowired
    private SnackRepository snackRepository;
    
    public List<Snack> getAllSnacks() {
        return snackRepository.findAll();
    }
    
    public Snack getSnackById(Long id) {
        return snackRepository.findById(id).orElse(null);
    }
}