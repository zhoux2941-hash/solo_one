package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.Employee;
import com.factory.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    public Result<Page<Employee>> findAll(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Employee> employees;
        
        if (keyword != null && !keyword.isEmpty()) {
            employees = employeeRepository.findByEmployeeNameContaining(keyword, pageable);
        } else {
            employees = employeeRepository.findAll(pageable);
        }
        
        return Result.success(employees);
    }

    public Result<List<Employee>> findByTeamId(Long teamId) {
        return Result.success(employeeRepository.findByTeamId(teamId));
    }

    public Result<Employee> findById(Long id) {
        Optional<Employee> employee = employeeRepository.findById(id);
        return employee.map(Result::success).orElseGet(() -> Result.error("人员不存在"));
    }

    public Result<Employee> save(Employee employee) {
        if (employeeRepository.existsByEmployeeNo(employee.getEmployeeNo())) {
            return Result.error("员工编号已存在");
        }
        Employee saved = employeeRepository.save(employee);
        return Result.success(saved);
    }

    public Result<Employee> update(Long id, Employee employee) {
        Optional<Employee> existingOptional = employeeRepository.findById(id);
        if (!existingOptional.isPresent()) {
            return Result.error("人员不存在");
        }

        Employee existing = existingOptional.get();
        
        if (!existing.getEmployeeNo().equals(employee.getEmployeeNo()) 
                && employeeRepository.existsByEmployeeNo(employee.getEmployeeNo())) {
            return Result.error("员工编号已存在");
        }

        employee.setId(id);
        employee.setCreateTime(existing.getCreateTime());
        Employee updated = employeeRepository.save(employee);
        return Result.success(updated);
    }

    public Result<Void> delete(Long id) {
        if (!employeeRepository.existsById(id)) {
            return Result.error("人员不存在");
        }
        employeeRepository.deleteById(id);
        return Result.success();
    }
}