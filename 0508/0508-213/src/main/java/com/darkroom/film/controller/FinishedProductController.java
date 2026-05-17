package com.darkroom.film.controller;

import com.darkroom.film.entity.FinishedProduct;
import com.darkroom.film.service.FinishedProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finished-products")
@CrossOrigin(origins = "*")
public class FinishedProductController {
    @Autowired
    private FinishedProductService finishedProductService;

    @GetMapping
    public List<FinishedProduct> getAllFinishedProducts() {
        return finishedProductService.findAll();
    }

    @GetMapping("/page")
    public Page<FinishedProduct> getFinishedProductsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return finishedProductService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FinishedProduct> getFinishedProductById(@PathVariable Long id) {
        return finishedProductService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/film/{filmId}")
    public ResponseEntity<FinishedProduct> getFinishedProductByFilmId(@PathVariable Long filmId) {
        return finishedProductService.findByFilmId(filmId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<FinishedProduct> getFinishedProductsByStatus(@PathVariable String status) {
        return finishedProductService.findByStatus(status);
    }

    @PostMapping
    public FinishedProduct createFinishedProduct(@RequestBody FinishedProduct finishedProduct) {
        return finishedProductService.save(finishedProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FinishedProduct> updateFinishedProduct(@PathVariable Long id, @RequestBody FinishedProduct finishedProduct) {
        return finishedProductService.findById(id)
                .map(existing -> {
                    finishedProduct.setId(id);
                    return ResponseEntity.ok(finishedProductService.save(finishedProduct));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<FinishedProduct> updateStatus(@PathVariable Long id, @RequestParam String status) {
        FinishedProduct updated = finishedProductService.updateStatus(id, status);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFinishedProduct(@PathVariable Long id) {
        return finishedProductService.findById(id)
                .map(product -> {
                    finishedProductService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}