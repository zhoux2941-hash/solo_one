package com.healthcare.service;

import com.healthcare.entity.CareLevel;
import com.healthcare.repository.CareLevelRepository;
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
public class CareLevelService {
    @Autowired
    private CareLevelRepository careLevelRepository;

    public CareLevel save(CareLevel careLevel) {
        if (careLevel.getId() == null) {
            if (careLevelRepository.existsByLevelCode(careLevel.getLevelCode())) {
                throw new RuntimeException("护理等级编码已存在");
            }
        } else {
            if (careLevelRepository.existsByLevelCodeAndIdNot(careLevel.getLevelCode(), careLevel.getId())) {
                throw new RuntimeException("护理等级编码已存在");
            }
        }
        return careLevelRepository.save(careLevel);
    }

    public void delete(Long id) {
        careLevelRepository.deleteById(id);
    }

    public CareLevel findById(Long id) {
        Optional<CareLevel> opt = careLevelRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<CareLevel> findPage(int page, int size, String levelName) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sortOrder"));
        Specification<CareLevel> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(levelName)) {
                predicates.add(cb.like(root.get("levelName"), "%" + levelName + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return careLevelRepository.findAll(spec, pageable);
    }

    public List<CareLevel> findAll() {
        return careLevelRepository.findByStatusOrderBySortOrderAsc(1);
    }
}
