package com.company.training.service;

import com.company.training.entity.Employee;
import com.company.training.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    public Optional<Employee> getEmployeeByNo(String employeeNo) {
        return employeeRepository.findByEmployeeNo(employeeNo);
    }

    @Transactional
    public Employee createEmployee(Employee employee) {
        if (employeeRepository.existsByEmployeeNo(employee.getEmployeeNo())) {
            throw new RuntimeException("员工编号已存在");
        }
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee updateEmployee(Long id, Employee employeeDetails) {
        return employeeRepository.findById(id)
                .map(employee -> {
                    employee.setName(employeeDetails.getName());
                    employee.setDepartment(employeeDetails.getDepartment());
                    employee.setPosition(employeeDetails.getPosition());
                    employee.setPhone(employeeDetails.getPhone());
                    employee.setEmail(employeeDetails.getEmail());
                    return employeeRepository.save(employee);
                })
                .orElseThrow(() -> new RuntimeException("员工不存在: " + id));
    }

    public boolean existsByEmployeeNo(String employeeNo) {
        return employeeRepository.existsByEmployeeNo(employeeNo);
    }
}
