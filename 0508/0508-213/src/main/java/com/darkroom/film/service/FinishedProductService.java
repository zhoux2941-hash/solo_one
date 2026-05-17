package com.darkroom.film.service;

import com.darkroom.film.entity.FinishedProduct;
import com.darkroom.film.repository.FinishedProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FinishedProductService {
    @Autowired
    private FinishedProductRepository finishedProductRepository;

    public List<FinishedProduct> findAll() {
        return finishedProductRepository.findAll();
    }

    public Page<FinishedProduct> findAll(Pageable pageable) {
        return finishedProductRepository.findAll(pageable);
    }

    public Optional<FinishedProduct> findById(Long id) {
        return finishedProductRepository.findById(id);
    }

    public Optional<FinishedProduct> findByFilmId(Long filmId) {
        return finishedProductRepository.findByFilmId(filmId);
    }

    public List<FinishedProduct> findByStatus(String status) {
        return finishedProductRepository.findByStatus(status);
    }

    public FinishedProduct save(FinishedProduct finishedProduct) {
        return finishedProductRepository.save(finishedProduct);
    }

    public void deleteById(Long id) {
        finishedProductRepository.deleteById(id);
    }

    public FinishedProduct updateStatus(Long id, String status) {
        Optional<FinishedProduct> optional = finishedProductRepository.findById(id);
        if (optional.isPresent()) {
            FinishedProduct product = optional.get();
            product.setStatus(status);
            return finishedProductRepository.save(product);
        }
        return null;
    }
}