package com.office.platform.service;

import com.office.platform.common.Result;
import com.office.platform.dto.EmployeeDTO;
import com.office.platform.entity.Department;
import com.office.platform.entity.Employee;
import com.office.platform.entity.Position;
import com.office.platform.entity.User;
import com.office.platform.repository.DepartmentRepository;
import com.office.platform.repository.EmployeeRepository;
import com.office.platform.repository.PositionRepository;
import com.office.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PositionRepository positionRepository;

    public Page<Employee> getEmployeeList(String name, Long departmentId, Long positionId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "updateTime"));
        return employeeRepository.findByConditions(name, departmentId, positionId, pageable);
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id).orElse(null);
    }

    public Employee getEmployeeByUserId(Long userId) {
        return employeeRepository.findByUserId(userId);
    }

    @Transactional
    public Result<Employee> createEmployee(EmployeeDTO employeeDTO) {
        if (employeeRepository.existsByIdCard(employeeDTO.getIdCard())) {
            return Result.error("身份证号已存在");
        }

        Employee employee = new Employee();
        employee.setName(employeeDTO.getName());
        employee.setIdCard(employeeDTO.getIdCard());
        employee.setPhone(employeeDTO.getPhone());
        employee.setEmail(employeeDTO.getEmail());
        employee.setEducation(employeeDTO.getEducation());
        employee.setEmergencyContact(employeeDTO.getEmergencyContact());
        employee.setEmergencyPhone(employeeDTO.getEmergencyPhone());
        employee.setAttachment(employeeDTO.getAttachment());
        employee.setEnabled(employeeDTO.getEnabled());

        if (employeeDTO.getEntryDate() != null && !employeeDTO.getEntryDate().isEmpty()) {
            employee.setEntryDate(LocalDate.parse(employeeDTO.getEntryDate(), DateTimeFormatter.ISO_DATE));
        }

        if (employeeDTO.getUserId() != null) {
            User user = userRepository.findById(employeeDTO.getUserId()).orElse(null);
            employee.setUser(user);
        }

        if (employeeDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(employeeDTO.getDepartmentId()).orElse(null);
            employee.setDepartment(department);
        }

        if (employeeDTO.getPositionId() != null) {
            Position position = positionRepository.findById(employeeDTO.getPositionId()).orElse(null);
            employee.setPosition(position);
        }

        employee = employeeRepository.save(employee);
        return Result.success("创建成功", employee);
    }

    @Transactional
    public Result<Employee> updateEmployee(Long id, EmployeeDTO employeeDTO) {
        Employee employee = employeeRepository.findById(id).orElse(null);
        if (employee == null) {
            return Result.error("员工档案不存在");
        }

        if (employeeRepository.existsByIdCardAndIdNot(employeeDTO.getIdCard(), id)) {
            return Result.error("身份证号已存在");
        }

        employee.setName(employeeDTO.getName());
        employee.setIdCard(employeeDTO.getIdCard());
        employee.setPhone(employeeDTO.getPhone());
        employee.setEmail(employeeDTO.getEmail());
        employee.setEducation(employeeDTO.getEducation());
        employee.setEmergencyContact(employeeDTO.getEmergencyContact());
        employee.setEmergencyPhone(employeeDTO.getEmergencyPhone());
        employee.setAttachment(employeeDTO.getAttachment());
        employee.setEnabled(employeeDTO.getEnabled());

        if (employeeDTO.getEntryDate() != null && !employeeDTO.getEntryDate().isEmpty()) {
            employee.setEntryDate(LocalDate.parse(employeeDTO.getEntryDate(), DateTimeFormatter.ISO_DATE));
        } else {
            employee.setEntryDate(null);
        }

        if (employeeDTO.getUserId() != null) {
            User user = userRepository.findById(employeeDTO.getUserId()).orElse(null);
            employee.setUser(user);
        } else {
            employee.setUser(null);
        }

        if (employeeDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(employeeDTO.getDepartmentId()).orElse(null);
            employee.setDepartment(department);
        } else {
            employee.setDepartment(null);
        }

        if (employeeDTO.getPositionId() != null) {
            Position position = positionRepository.findById(employeeDTO.getPositionId()).orElse(null);
            employee.setPosition(position);
        } else {
            employee.setPosition(null);
        }

        employee = employeeRepository.save(employee);
        return Result.success("更新成功", employee);
    }

    @Transactional
    public Result<String> deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            return Result.error("员工档案不存在");
        }
        employeeRepository.deleteById(id);
        return Result.success("删除成功");
    }
}
