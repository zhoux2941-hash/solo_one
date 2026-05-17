package com.wenwan.bracelet.controller;

import com.wenwan.bracelet.entity.StyleTemplate;
import com.wenwan.bracelet.entity.StyleTemplate.TemplateCategory;
import com.wenwan.bracelet.service.StyleTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/style-templates")
@CrossOrigin(origins = "*")
public class StyleTemplateController {

    @Autowired
    private StyleTemplateService styleTemplateService;

    @GetMapping
    public ResponseEntity<List<StyleTemplate>> getAllTemplates() {
        return ResponseEntity.ok(styleTemplateService.findAll());
    }

    @GetMapping("/published")
    public ResponseEntity<List<StyleTemplate>> getPublishedTemplates() {
        return ResponseEntity.ok(styleTemplateService.findPublished());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StyleTemplate> getTemplateById(@PathVariable Long id) {
        StyleTemplate template = styleTemplateService.findById(id);
        return template != null ? ResponseEntity.ok(template) : ResponseEntity.notFound().build();
    }

    @GetMapping("/craftsman/{craftsmanId}")
    public ResponseEntity<List<StyleTemplate>> getTemplatesByCraftsman(@PathVariable Long craftsmanId) {
        return ResponseEntity.ok(styleTemplateService.findByCraftsmanId(craftsmanId));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<StyleTemplate>> getTemplatesByCategory(@PathVariable String category) {
        try {
            TemplateCategory templateCategory = TemplateCategory.valueOf(category);
            return ResponseEntity.ok(styleTemplateService.findByCategory(templateCategory));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/published/category/{category}")
    public ResponseEntity<List<StyleTemplate>> getPublishedTemplatesByCategory(@PathVariable String category) {
        try {
            TemplateCategory templateCategory = TemplateCategory.valueOf(category);
            return ResponseEntity.ok(styleTemplateService.findPublishedByCategory(templateCategory));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<StyleTemplate> createTemplate(@RequestBody StyleTemplate template, @PathVariable Long userId) {
        StyleTemplate newTemplate = styleTemplateService.createTemplate(template, userId);
        return newTemplate != null ? ResponseEntity.ok(newTemplate) : ResponseEntity.badRequest().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<StyleTemplate> updateTemplate(@PathVariable Long id, @RequestBody StyleTemplate templateDetails) {
        StyleTemplate template = styleTemplateService.updateTemplate(id, templateDetails);
        return template != null ? ResponseEntity.ok(template) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        styleTemplateService.deleteTemplate(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<StyleTemplate> incrementViewCount(@PathVariable Long id) {
        StyleTemplate template = styleTemplateService.incrementViewCount(id);
        return template != null ? ResponseEntity.ok(template) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<StyleTemplate> incrementLikeCount(@PathVariable Long id) {
        StyleTemplate template = styleTemplateService.incrementLikeCount(id);
        return template != null ? ResponseEntity.ok(template) : ResponseEntity.notFound().build();
    }
}
