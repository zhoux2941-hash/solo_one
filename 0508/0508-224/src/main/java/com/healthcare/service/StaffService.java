package com.healthcare.service;

import com.healthcare.entity.Staff;
import com.healthcare.repository.StaffRepository;
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
public class StaffService {
    @Autowired
    private StaffRepository staffRepository;

    public Staff save(Staff staff) {
        if (staff.getId() == null) {
            if (staffRepository.existsByStaffNo(staff.getStaffNo())) {
                throw new RuntimeException("员工编号已存在");
            }
        } else {
            if (staffRepository.existsByStaffNoAndIdNot(staff.getStaffNo(), staff.getId())) {
                throw new RuntimeException("员工编号已存在");
            }
        }
        return staffRepository.save(staff);
    }

    public void delete(Long id) {
        staffRepository.deleteById(id);
    }

    public Staff findById(Long id) {
        Optional<Staff> opt = staffRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<Staff> findPage(int page, int size, String name, String staffType, String department, String workStatus, Long orgId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<Staff> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(name)) {
                predicates.add(cb.like(root.get("name"), "%" + name + "%"));
            }
            if (StringUtils.hasText(staffType)) {
                predicates.add(cb.equal(root.get("staffType"), staffType));
            }
            if (StringUtils.hasText(department)) {
                predicates.add(cb.like(root.get("department"), "%" + department + "%"));
            }
            if (StringUtils.hasText(workStatus)) {
                predicates.add(cb.equal(root.get("workStatus"), workStatus));
            }
            if (orgId != null) {
                predicates.add(cb.equal(root.get("orgId"), orgId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return staffRepository.findAll(spec, pageable);
    }
}