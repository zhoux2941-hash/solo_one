package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.repository.EmployeeRepository;
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
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    public Map<String, Object> save(Employee employee) {
        Employee savedEmp;
        
        if (employee.getId() == null) {
            // 新增员工
            if (employeeRepository.existsByEmpNo(employee.getEmpNo())) {
                return Map.of("success", false, "message", "员工编号已存在");
            }
            if (StringUtils.hasText(employee.getIdCard()) && employeeRepository.existsByIdCard(employee.getIdCard())) {
                return Map.of("success", false, "message", "身份证号已存在");
            }
            savedEmp = employeeRepository.save(employee);
        } else {
            // 更新员工
            Employee existEmp = employeeRepository.findById(employee.getId()).orElse(null);
            if (existEmp == null) {
                return Map.of("success", false, "message", "员工不存在");
            }
            
            // 检查编号是否被其他员工占用
            Employee empByNo = employeeRepository.findByEmpNo(employee.getEmpNo()).orElse(null);
            if (empByNo != null && !empByNo.getId().equals(employee.getId())) {
                return Map.of("success", false, "message", "员工编号已存在");
            }
            
            // 更新字段
            existEmp.setEmpNo(employee.getEmpNo());
            existEmp.setName(employee.getName());
            existEmp.setGender(employee.getGender());
            existEmp.setBirthDate(employee.getBirthDate());
            existEmp.setIdCard(employee.getIdCard());
            existEmp.setPhone(employee.getPhone());
            existEmp.setEmail(employee.getEmail());
            existEmp.setAddress(employee.getAddress());
            existEmp.setDepartment(employee.getDepartment());
            existEmp.setPosition(employee.getPosition());
            existEmp.setJurisdictionArea(employee.getJurisdictionArea());
            existEmp.setEntryDate(employee.getEntryDate());
            existEmp.setStatus(employee.getStatus());
            
            savedEmp = employeeRepository.save(existEmp);
        }

        return Map.of("success", true, "message", "保存成功", "data", savedEmp);
    }

    public Map<String, Object> delete(Long id) {
        if (!employeeRepository.existsById(id)) {
            return Map.of("success", false, "message", "员工不存在");
        }
        employeeRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Optional<Employee> findById(Long id) {
        return employeeRepository.findById(id);
    }

    public List<Employee> findAll() {
        return employeeRepository.findAll();
    }

    public List<Employee> findByDepartment(Long departmentId) {
        return employeeRepository.findByDepartmentId(departmentId);
    }

    public Page<Employee> findByPage(String keyword, Long departmentId, String status, Pageable pageable) {
        Specification<Employee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                predicates.add(cb.or(
                        cb.like(root.get("empNo"), "%" + keyword + "%"),
                        cb.like(root.get("name"), "%" + keyword + "%"),
                        cb.like(root.get("phone"), "%" + keyword + "%")
                ));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return employeeRepository.findAll(spec, pageable);
    }
}
