package com.office.platform.service;

import com.office.platform.common.Result;
import com.office.platform.dto.PositionDTO;
import com.office.platform.entity.Department;
import com.office.platform.entity.Position;
import com.office.platform.repository.DepartmentRepository;
import com.office.platform.repository.EmployeeRepository;
import com.office.platform.repository.PositionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PositionService {

    @Autowired
    private PositionRepository positionRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Page<Position> getPositionList(String name, String level, Long departmentId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "updateTime"));
        return positionRepository.findByConditions(name, level, departmentId, pageable);
    }

    public List<Position> getEnabledPositions() {
        return positionRepository.findByEnabledTrue();
    }

    public Position getPositionById(Long id) {
        return positionRepository.findById(id).orElse(null);
    }

    @Transactional
    public Result<Position> createPosition(PositionDTO positionDTO) {
        if (positionRepository.existsByName(positionDTO.getName())) {
            return Result.error("岗位名称已存在");
        }

        Position position = new Position();
        position.setName(positionDTO.getName());
        position.setLevel(positionDTO.getLevel());
        position.setDescription(positionDTO.getDescription());
        position.setEnabled(positionDTO.getEnabled());

        if (positionDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(positionDTO.getDepartmentId()).orElse(null);
            position.setDepartment(department);
        }

        position = positionRepository.save(position);
        return Result.success("创建成功", position);
    }

    @Transactional
    public Result<Position> updatePosition(Long id, PositionDTO positionDTO) {
        Position position = positionRepository.findById(id).orElse(null);
        if (position == null) {
            return Result.error("岗位不存在");
        }

        if (positionRepository.existsByNameAndIdNot(positionDTO.getName(), id)) {
            return Result.error("岗位名称已存在");
        }

        position.setName(positionDTO.getName());
        position.setLevel(positionDTO.getLevel());
        position.setDescription(positionDTO.getDescription());
        position.setEnabled(positionDTO.getEnabled());

        if (positionDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(positionDTO.getDepartmentId()).orElse(null);
            position.setDepartment(department);
        } else {
            position.setDepartment(null);
        }

        position = positionRepository.save(position);
        return Result.success("更新成功", position);
    }

    @Transactional
    public Result<String> deletePosition(Long id) {
        if (!positionRepository.existsById(id)) {
            return Result.error("岗位不存在");
        }

        long employeeCount = employeeRepository.countByPositionId(id);
        if (employeeCount > 0) {
            return Result.error("该岗位下还有员工，无法删除");
        }

        positionRepository.deleteById(id);
        return Result.success("删除成功");
    }

    @Transactional
    public Result<String> togglePositionStatus(Long id) {
        Position position = positionRepository.findById(id).orElse(null);
        if (position == null) {
            return Result.error("岗位不存在");
        }
        position.setEnabled(!position.getEnabled());
        positionRepository.save(position);
        return Result.success(position.getEnabled() ? "已启用" : "已禁用");
    }
}
