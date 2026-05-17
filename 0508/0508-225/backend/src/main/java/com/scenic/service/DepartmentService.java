package com.scenic.service;

import com.scenic.entity.Department;
import com.scenic.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public Map<String, Object> save(Department department) {
        Department savedDept;
        
        if (department.getId() == null) {
            // 新增部门
            if (departmentRepository.existsByDeptCode(department.getDeptCode())) {
                return Map.of("success", false, "message", "部门编码已存在");
            }
            if (departmentRepository.existsByDeptName(department.getDeptName())) {
                return Map.of("success", false, "message", "部门名称已存在");
            }
            savedDept = departmentRepository.save(department);
        } else {
            // 更新部门
            Department existDept = departmentRepository.findById(department.getId()).orElse(null);
            if (existDept == null) {
                return Map.of("success", false, "message", "部门不存在");
            }
            
            // 检查编码是否被其他部门占用
            Department deptByCode = departmentRepository.findByDeptCode(department.getDeptCode()).orElse(null);
            if (deptByCode != null && !deptByCode.getId().equals(department.getId())) {
                return Map.of("success", false, "message", "部门编码已存在");
            }
            
            // 检查名称是否被其他部门占用
            Department deptByName = departmentRepository.findByDeptName(department.getDeptName()).orElse(null);
            if (deptByName != null && !deptByName.getId().equals(department.getId())) {
                return Map.of("success", false, "message", "部门名称已存在");
            }
            
            // 更新字段
            existDept.setDeptCode(department.getDeptCode());
            existDept.setDeptName(department.getDeptName());
            existDept.setManager(department.getManager());
            existDept.setPhone(department.getPhone());
            existDept.setSortOrder(department.getSortOrder());
            existDept.setStatus(department.getStatus());
            
            savedDept = departmentRepository.save(existDept);
        }

        return Map.of("success", true, "message", "保存成功", "data", savedDept);
    }

    public Map<String, Object> delete(Long id) {
        if (!departmentRepository.existsById(id)) {
            return Map.of("success", false, "message", "部门不存在");
        }
        departmentRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Optional<Department> findById(Long id) {
        return departmentRepository.findById(id);
    }

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public List<Department> findActive() {
        return departmentRepository.findByStatus(true);
    }

    public Page<Department> findByPage(String keyword, Pageable pageable) {
        Specification<Department> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                predicates.add(cb.or(
                        cb.like(root.get("deptCode"), "%" + keyword + "%"),
                        cb.like(root.get("deptName"), "%" + keyword + "%")
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return departmentRepository.findAll(spec, pageable);
    }
}
