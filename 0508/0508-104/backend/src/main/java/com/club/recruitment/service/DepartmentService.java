package com.club.recruitment.service;

import com.club.recruitment.dto.DepartmentRequest;
import com.club.recruitment.entity.Department;
import com.club.recruitment.entity.InterviewSlot;
import com.club.recruitment.repository.DepartmentRepository;
import com.club.recruitment.repository.InterviewSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String DEPARTMENT_ASSIGNED_COUNT_KEY = "department:assigned:count:";
    private static final String SEPARATOR = ",";

    @Transactional
    public Department createDepartment(DepartmentRequest request) {
        Department department = new Department();
        department.setName(request.getName());
        department.setMaxCapacity(request.getMaxCapacity());
        department.setInterviewersPerSlot(request.getInterviewersPerSlot());
        department.setAvailableSlots(request.getAvailableSlots());
        return departmentRepository.save(department);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findByActiveTrueOrderById();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("部门不存在"));
    }

    public Long getAssignedCountFromRedis(Long departmentId) {
        String key = DEPARTMENT_ASSIGNED_COUNT_KEY + departmentId;
        Object count = redisTemplate.opsForValue().get(key);
        if (count == null) {
            return 0L;
        }
        return ((Number) count).longValue();
    }

    public void setAssignedCountToRedis(Long departmentId, Long count) {
        String key = DEPARTMENT_ASSIGNED_COUNT_KEY + departmentId;
        redisTemplate.opsForValue().set(key, count);
    }

    public void incrementAssignedCountInRedis(Long departmentId) {
        String key = DEPARTMENT_ASSIGNED_COUNT_KEY + departmentId;
        redisTemplate.opsForValue().increment(key);
    }

    public void decrementAssignedCountInRedis(Long departmentId) {
        String key = DEPARTMENT_ASSIGNED_COUNT_KEY + departmentId;
        redisTemplate.opsForValue().decrement(key);
    }

    public boolean isDepartmentFull(Long departmentId) {
        Department dept = getDepartmentById(departmentId);
        Long assignedCount = getAssignedCountFromRedis(departmentId);
        return assignedCount >= dept.getMaxCapacity();
    }

    public List<Map<String, Object>> getAvailableSlotsWithCapacity(Long departmentId) {
        Department dept = getDepartmentById(departmentId);
        List<String> allSlots = parseList(dept.getAvailableSlots());
        
        initializeSlotsIfNeeded(dept);
        List<InterviewSlot> slots = interviewSlotRepository.findByDepartmentId(departmentId);
        
        Map<String, InterviewSlot> slotMap = slots.stream()
                .collect(java.util.stream.Collectors.toMap(InterviewSlot::getSlot, s -> s));

        List<Map<String, Object>> result = new ArrayList<>();
        for (String slotTime : allSlots) {
            InterviewSlot slot = slotMap.get(slotTime);
            Map<String, Object> slotInfo = new HashMap<>();
            slotInfo.put("slot", slotTime);
            slotInfo.put("maxCapacity", slot != null ? slot.getMaxCapacity() : dept.getInterviewersPerSlot() * 2);
            slotInfo.put("currentCount", slot != null ? slot.getCurrentCount() : 0);
            slotInfo.put("available", slot == null || slot.getCurrentCount() < slot.getMaxCapacity());
            result.add(slotInfo);
        }
        
        return result;
    }

    private void initializeSlotsIfNeeded(Department dept) {
        List<String> availableSlots = parseList(dept.getAvailableSlots());
        int perSlotCapacity = dept.getInterviewersPerSlot() * 2;

        for (String slotTime : availableSlots) {
            Optional<InterviewSlot> existing = interviewSlotRepository.findByDepartmentIdAndSlot(dept.getId(), slotTime);
            if (existing.isEmpty()) {
                InterviewSlot newSlot = new InterviewSlot();
                newSlot.setDepartmentId(dept.getId());
                newSlot.setSlot(slotTime);
                newSlot.setMaxCapacity(perSlotCapacity);
                newSlot.setCurrentCount(0);
                interviewSlotRepository.save(newSlot);
            }
        }
    }

    private List<String> parseList(String str) {
        if (str == null || str.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(str.split(SEPARATOR));
    }
}