package com.healthcare.service;

import com.healthcare.entity.Organization;
import com.healthcare.repository.OrganizationRepository;
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
public class OrganizationService {
    @Autowired
    private OrganizationRepository organizationRepository;

    public Organization save(Organization organization) {
        if (organization.getId() == null) {
            if (organizationRepository.existsByName(organization.getName())) {
                throw new RuntimeException("机构名称已存在");
            }
        } else {
            if (organizationRepository.existsByNameAndIdNot(organization.getName(), organization.getId())) {
                throw new RuntimeException("机构名称已存在");
            }
        }
        return organizationRepository.save(organization);
    }

    public void delete(Long id) {
        organizationRepository.deleteById(id);
    }

    public Organization findById(Long id) {
        Optional<Organization> opt = organizationRepository.findById(id);
        return opt.orElse(null);
    }

    public List<Organization> findAll() {
        return organizationRepository.findAll();
    }

    public List<Organization> findByParentId(Long parentId) {
        return organizationRepository.findByParentId(parentId);
    }

    public Page<Organization> findPage(int page, int size, String name, String type, Integer status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<Organization> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(name)) {
                predicates.add(cb.like(root.get("name"), "%" + name + "%"));
            }
            if (StringUtils.hasText(type)) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return organizationRepository.findAll(spec, pageable);
    }
}