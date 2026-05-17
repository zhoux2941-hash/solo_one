package com.healthcare.service;

import com.healthcare.entity.CareItem;
import com.healthcare.repository.CareItemRepository;
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
public class CareItemService {
    @Autowired
    private CareItemRepository careItemRepository;

    public CareItem save(CareItem careItem) {
        if (careItem.getId() == null) {
            if (careItemRepository.existsByItemCode(careItem.getItemCode())) {
                throw new RuntimeException("护理项目编码已存在");
            }
        } else {
            if (careItemRepository.existsByItemCodeAndIdNot(careItem.getItemCode(), careItem.getId())) {
                throw new RuntimeException("护理项目编码已存在");
            }
        }
        return careItemRepository.save(careItem);
    }

    public void delete(Long id) {
        careItemRepository.deleteById(id);
    }

    public CareItem findById(Long id) {
        Optional<CareItem> opt = careItemRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<CareItem> findPage(int page, int size, String itemName, String category) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<CareItem> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(itemName)) {
                predicates.add(cb.like(root.get("itemName"), "%" + itemName + "%"));
            }
            if (StringUtils.hasText(category)) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return careItemRepository.findAll(spec, pageable);
    }

    public List<CareItem> findAll() {
        return careItemRepository.findByStatusOrderByIdAsc(1);
    }
}
