package com.office.platform.controller;

import com.office.platform.common.Result;
import com.office.platform.dto.PositionDTO;
import com.office.platform.entity.Employee;
import com.office.platform.entity.Position;
import com.office.platform.repository.EmployeeRepository;
import com.office.platform.service.PositionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/positions")
public class PositionController {

    @Autowired
    private PositionService positionService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping
    public Result<Page<Position>> getPositionList(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Position> positionPage = positionService.getPositionList(name, level, departmentId, page, size);
        return Result.success(positionPage);
    }

    @GetMapping("/enabled")
    public Result<List<Position>> getEnabledPositions() {
        List<Position> positions = positionService.getEnabledPositions();
        return Result.success(positions);
    }

    @GetMapping("/{id}")
    public Result<Position> getPositionById(@PathVariable Long id) {
        Position position = positionService.getPositionById(id);
        if (position == null) {
            return Result.error("岗位不存在");
        }
        return Result.success(position);
    }

    @GetMapping("/{id}/employees")
    public Result<List<Employee>> getEmployeesByPosition(@PathVariable Long id) {
        List<Employee> employees = employeeRepository.findByPositionId(id);
        return Result.success(employees);
    }

    @GetMapping("/{id}/statistics")
    public Result<Map<String, Object>> getPositionStatistics(@PathVariable Long id) {
        Position position = positionService.getPositionById(id);
        if (position == null) {
            return Result.error("岗位不存在");
        }
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("position", position);
        statistics.put("employeeCount", employeeRepository.countByPositionId(id));
        return Result.success(statistics);
    }

    @PostMapping
    public Result<Position> createPosition(@Validated @RequestBody PositionDTO positionDTO) {
        return positionService.createPosition(positionDTO);
    }

    @PutMapping("/{id}")
    public Result<Position> updatePosition(@PathVariable Long id, @Validated @RequestBody PositionDTO positionDTO) {
        return positionService.updatePosition(id, positionDTO);
    }

    @DeleteMapping("/{id}")
    public Result<String> deletePosition(@PathVariable Long id) {
        return positionService.deletePosition(id);
    }

    @PutMapping("/{id}/status")
    public Result<String> togglePositionStatus(@PathVariable Long id) {
        return positionService.togglePositionStatus(id);
    }
}
