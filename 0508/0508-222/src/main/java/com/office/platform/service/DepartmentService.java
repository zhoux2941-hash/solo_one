package com.office.platform.service;

import com.office.platform.common.Result;
import com.office.platform.dto.DepartmentDTO;
import com.office.platform.entity.Department;
import com.office.platform.repository.DepartmentRepository;
import com.office.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    public Page<Department> getDepartmentList(String name, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "updateTime"));
        if (name != null && !name.isEmpty()) {
            return departmentRepository.findByNameContaining(name, pageable);
        }
        return departmentRepository.findAll(pageable);
    }

    public List<Department> getAllEnabledDepartments() {
        return departmentRepository.findByEnabled(true);
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id).orElse(null);
    }

    public Map<String, Object> getDepartmentDetail(Long id) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) {
            return null;
        }
        long employeeCount = userRepository.countByDepartmentId(id);
        Map<String, Object> result = new HashMap<>();
        result.put("department", department);
        result.put("employeeCount", employeeCount);
        return result;
    }

    @Transactional
    public Result<Department> createDepartment(DepartmentDTO departmentDTO) {
        if (departmentRepository.existsByName(departmentDTO.getName())) {
            return Result.error("部门名称已存在");
        }

        Department department = new Department();
        department.setName(departmentDTO.getName());
        department.setDescription(departmentDTO.getDescription());
        department.setEnabled(departmentDTO.getEnabled());

        department = departmentRepository.save(department);
        return Result.success("创建成功", department);
    }

    @Transactional
    public Result<Department> updateDepartment(Long id, DepartmentDTO departmentDTO) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) {
            return Result.error("部门不存在");
        }

        if (departmentRepository.existsByNameAndIdNot(departmentDTO.getName(), id)) {
            return Result.error("部门名称已存在");
        }

        department.setName(departmentDTO.getName());
        department.setDescription(departmentDTO.getDescription());
        department.setEnabled(departmentDTO.getEnabled());

        department = departmentRepository.save(department);
        return Result.success("更新成功", department);
    }

    @Transactional
    public Result<String> deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            return Result.error("部门不存在");
        }
        long employeeCount = userRepository.countByDepartmentId(id);
        if (employeeCount > 0) {
            return Result.error("该部门下还有员工，无法删除");
        }
        departmentRepository.deleteById(id);
        return Result.success("删除成功");
    }

    @Transactional
    public Result<String> toggleDepartmentStatus(Long id) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) {
            return Result.error("部门不存在");
        }
        department.setEnabled(!department.getEnabled());
        departmentRepository.save(department);
        return Result.success(department.getEnabled() ? "已启用" : "已禁用");
    }
}