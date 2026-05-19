package com.community.buying.service;

import com.community.buying.entity.Category;
import com.community.buying.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public List<Category> findByStatus(Integer status) {
        return categoryRepository.findByStatusOrderBySortOrderAsc(status);
    }

    public void deleteById(Long id) {
        categoryRepository.deleteById(id);
    }
}