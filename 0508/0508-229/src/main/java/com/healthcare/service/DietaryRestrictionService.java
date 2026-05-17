package com.healthcare.service;

import com.healthcare.entity.DietaryRestriction;
import com.healthcare.repository.DietaryRestrictionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DietaryRestrictionService {
    @Autowired
    private DietaryRestrictionRepository dietaryRestrictionRepository;

    public DietaryRestriction save(DietaryRestriction dietaryRestriction) {
        if (dietaryRestriction.getId() == null) {
            if (dietaryRestrictionRepository.existsByRestrictionCode(dietaryRestriction.getRestrictionCode())) {
                throw new RuntimeException("饮食禁忌编码已存在");
            }
        } else {
            if (dietaryRestrictionRepository.existsByRestrictionCodeAndIdNot(dietaryRestriction.getRestrictionCode(), dietaryRestriction.getId())) {
                throw new RuntimeException("饮食禁忌编码已存在");
            }
        }
        return dietaryRestrictionRepository.save(dietaryRestriction);
    }

    public void delete(Long id) {
        dietaryRestrictionRepository.deleteById(id);
    }

    public DietaryRestriction findById(Long id) {
        Optional<DietaryRestriction> opt = dietaryRestrictionRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<DietaryRestriction> findPage(int page, int size, String restrictionName) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<DietaryRestriction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(restrictionName)) {
                predicates.add(cb.like(root.get("restrictionName"), "%" + restrictionName + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return dietaryRestrictionRepository.findAll(spec, pageable);
    }

    public List<DietaryRestriction> findAll() {
        return dietaryRestrictionRepository.findByStatusOrderByIdAsc(1);
    }
}
