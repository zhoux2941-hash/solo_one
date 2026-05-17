package com.wenwan.bracelet.repository;

import com.wenwan.bracelet.entity.StyleTemplate;
import com.wenwan.bracelet.entity.StyleTemplate.TemplateCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StyleTemplateRepository extends JpaRepository<StyleTemplate, Long> {
    
    List<StyleTemplate> findByCategoryAndIsPublishedTrue(TemplateCategory category);
    
    List<StyleTemplate> findByIsPublishedTrue();
    
    List<StyleTemplate> findByCraftsmanId(Long craftsmanId);
    
    List<StyleTemplate> findByCategory(TemplateCategory category);
}
