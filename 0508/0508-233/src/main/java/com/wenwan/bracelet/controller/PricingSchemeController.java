package com.wenwan.bracelet.controller;

import com.wenwan.bracelet.entity.PricingScheme;
import com.wenwan.bracelet.service.PricingSchemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@CrossOrigin(origins = "*")
public class PricingSchemeController {

    @Autowired
    private PricingSchemeService pricingSchemeService;

    @GetMapping("/craftsman/{craftsmanId}")
    public ResponseEntity<List<PricingScheme>> getPricingByCraftsman(@PathVariable Long craftsmanId) {
        return ResponseEntity.ok(pricingSchemeService.findByCraftsmanId(craftsmanId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PricingScheme> getPricingById(@PathVariable Long id) {
        PricingScheme pricingScheme = pricingSchemeService.findById(id);
        return pricingScheme != null ? ResponseEntity.ok(pricingScheme) : ResponseEntity.notFound().build();
    }

    @GetMapping("/craftsman/{craftsmanId}/default")
    public ResponseEntity<PricingScheme> getDefaultPricing(@PathVariable Long craftsmanId) {
        PricingScheme pricingScheme = pricingSchemeService.findDefaultByCraftsmanId(craftsmanId);
        return pricingScheme != null ? ResponseEntity.ok(pricingScheme) : ResponseEntity.notFound().build();
    }

    @PostMapping("/craftsman/{craftsmanId}")
    public ResponseEntity<PricingScheme> createPricingScheme(@RequestBody PricingScheme pricingScheme, @PathVariable Long craftsmanId) {
        PricingScheme newScheme = pricingSchemeService.createPricingScheme(pricingScheme, craftsmanId);
        return newScheme != null ? ResponseEntity.ok(newScheme) : ResponseEntity.badRequest().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<PricingScheme> updatePricingScheme(@PathVariable Long id, @RequestBody PricingScheme pricingSchemeDetails) {
        PricingScheme pricingScheme = pricingSchemeService.updatePricingScheme(id, pricingSchemeDetails);
        return pricingScheme != null ? ResponseEntity.ok(pricingScheme) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePricingScheme(@PathVariable Long id) {
        pricingSchemeService.deletePricingScheme(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/craftsman/{craftsmanId}/default/{pricingSchemeId}")
    public ResponseEntity<PricingScheme> setDefaultPricing(@PathVariable Long craftsmanId, @PathVariable Long pricingSchemeId) {
        PricingScheme pricingScheme = pricingSchemeService.setDefault(craftsmanId, pricingSchemeId);
        return pricingScheme != null ? ResponseEntity.ok(pricingScheme) : ResponseEntity.notFound().build();
    }
}