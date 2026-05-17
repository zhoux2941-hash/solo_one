package com.wenwan.bracelet.service;

import com.wenwan.bracelet.entity.StyleTemplate;
import com.wenwan.bracelet.entity.StyleTemplate.TemplateCategory;
import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.repository.StyleTemplateRepository;
import com.wenwan.bracelet.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StyleTemplateService {

    @Autowired
    private StyleTemplateRepository styleTemplateRepository;

    @Autowired
    private UserRepository userRepository;

    public List<StyleTemplate> findAll() {
        return styleTemplateRepository.findAll();
    }

    public List<StyleTemplate> findPublished() {
        return styleTemplateRepository.findByIsPublishedTrue();
    }

    public StyleTemplate findById(Long id) {
        return styleTemplateRepository.findById(id).orElse(null);
    }

    public List<StyleTemplate> findByCraftsmanId(Long craftsmanId) {
        return styleTemplateRepository.findByCraftsmanId(craftsmanId);
    }

    public List<StyleTemplate> findByCategory(TemplateCategory category) {
        return styleTemplateRepository.findByCategory(category);
    }

    public List<StyleTemplate> findPublishedByCategory(TemplateCategory category) {
        return styleTemplateRepository.findByCategoryAndIsPublishedTrue(category);
    }

    public StyleTemplate createTemplate(StyleTemplate template, Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && (user.getRole() == User.UserRole.CRAFTSMAN || user.getRole() == User.UserRole.ADMIN)) {
            template.setCraftsman(user);
            return styleTemplateRepository.save(template);
        }
        return null;
    }

    public StyleTemplate updateTemplate(Long id, StyleTemplate templateDetails) {
        StyleTemplate template = findById(id);
        if (template != null) {
            template.setName(templateDetails.getName());
            template.setCategory(templateDetails.getCategory());
            template.setDescription(templateDetails.getDescription());
            template.setOverallSize(templateDetails.getOverallSize());
            template.setTargetAudience(templateDetails.getTargetAudience());
            template.setColorScheme(templateDetails.getColorScheme());
            template.setSymbolicMeaning(templateDetails.getSymbolicMeaning());
            template.setPrice(templateDetails.getPrice());
            template.setMainImageUrl(templateDetails.getMainImageUrl());
            template.setImageUrls(templateDetails.getImageUrls());
            template.setMaterialList(templateDetails.getMaterialList());
            template.setBeadCount(templateDetails.getBeadCount());
            template.setBeadSize(templateDetails.getBeadSize());
            template.setPublished(templateDetails.getPublished());
            return styleTemplateRepository.save(template);
        }
        return null;
    }

    public void deleteTemplate(Long id) {
        styleTemplateRepository.deleteById(id);
    }

    public StyleTemplate incrementViewCount(Long id) {
        StyleTemplate template = findById(id);
        if (template != null) {
            template.setViewCount(template.getViewCount() + 1);
            return styleTemplateRepository.save(template);
        }
        return null;
    }

    public StyleTemplate incrementLikeCount(Long id) {
        StyleTemplate template = findById(id);
        if (template != null) {
            template.setLikeCount(template.getLikeCount() + 1);
            return styleTemplateRepository.save(template);
        }
        return null;
    }

    public StyleTemplate incrementUseCount(Long id) {
        StyleTemplate template = findById(id);
        if (template != null) {
            template.setUseCount(template.getUseCount() + 1);
            return styleTemplateRepository.save(template);
        }
        return null;
    }
}
