package com.healthcare.service;

import com.healthcare.entity.Elder;
import com.healthcare.repository.ElderRepository;
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
public class ElderService {
    @Autowired
    private ElderRepository elderRepository;

    public Elder save(Elder elder) {
        if (elder.getId() == null) {
            if (elderRepository.existsByElderNo(elder.getElderNo())) {
                throw new RuntimeException("长者编号已存在");
            }
        } else {
            if (elderRepository.existsByElderNoAndIdNot(elder.getElderNo(), elder.getId())) {
                throw new RuntimeException("长者编号已存在");
            }
        }
        return elderRepository.save(elder);
    }

    public void delete(Long id) {
        elderRepository.deleteById(id);
    }

    public Elder findById(Long id) {
        Optional<Elder> opt = elderRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<Elder> findPage(int page, int size, String name, String livingStatus, Long orgId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<Elder> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(name)) {
                predicates.add(cb.like(root.get("name"), "%" + name + "%"));
            }
            if (StringUtils.hasText(livingStatus)) {
                predicates.add(cb.equal(root.get("livingStatus"), livingStatus));
            }
            if (orgId != null) {
                predicates.add(cb.equal(root.get("orgId"), orgId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return elderRepository.findAll(spec, pageable);
    }

    public List<Elder> findAll() {
        return elderRepository.findAll();
    }
}
