package com.community.buying.repository;

import com.community.buying.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByStatusOrderBySortOrderAsc(Integer status);
}