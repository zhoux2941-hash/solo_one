package com.club.recruitment.service;

import com.club.recruitment.dto.ApplicantRequest;
import com.club.recruitment.dto.InterviewListResponse;
import com.club.recruitment.entity.Applicant;
import com.club.recruitment.entity.Department;
import com.club.recruitment.entity.InterviewSlot;
import com.club.recruitment.repository.ApplicantRepository;
import com.club.recruitment.repository.DepartmentRepository;
import com.club.recruitment.repository.InterviewSlotRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicantService {

    private final ApplicantRepository applicantRepository;
    private final DepartmentRepository departmentRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final DepartmentService departmentService;
    private final ObjectMapper objectMapper;

    private static final String SEPARATOR = ",";

    @Transactional
    public Applicant registerApplicant(ApplicantRequest request) {
        Optional<Applicant> existing = applicantRepository.findByStudentId(request.getStudentId());
        if (existing.isPresent()) {
            throw new RuntimeException("该学号已报名");
        }

        Applicant applicant = new Applicant();
        applicant.setName(request.getName());
        applicant.setStudentId(request.getStudentId());
        applicant.setPreferredDepartments(String.join(SEPARATOR, request.getPreferredDepartments()));
        applicant.setAcceptAdjustment(request.getAcceptAdjustment());
        applicant.setFreeSlots(String.join(SEPARATOR, request.getFreeSlots()));
        applicant.setAssigned(false);

        return applicantRepository.save(applicant);
    }

    public List<Applicant> getAllApplicants() {
        return applicantRepository.findAll();
    }

    public List<Applicant> getUnassignedApplicants() {
        return applicantRepository.findByAssignedFalse();
    }

    public List<InterviewListResponse> getInterviewListByDepartment(Long departmentId) {
        List<Applicant> applicants = applicantRepository.findAssignedByDepartmentId(departmentId);
        return applicants.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private InterviewListResponse convertToResponse(Applicant applicant) {
        InterviewListResponse response = new InterviewListResponse();
        response.setApplicantId(applicant.getId());
        response.setName(applicant.getName());
        response.setStudentId(applicant.getStudentId());
        response.setAssignedDepartmentName(applicant.getAssignedDepartmentName());
        response.setAssignedSlot(applicant.getAssignedSlot());
        response.setPriority(applicant.getPriority());
        response.setAcceptAdjustment(applicant.getAcceptAdjustment());
        return response;
    }

    @Transactional
    public Map<String, Object> runAllocation() {
        log.info("开始面试时间分配");
        
        List<Applicant> unassignedApplicants = getUnassignedApplicants();
        if (unassignedApplicants.isEmpty()) {
            log.warn("没有需要分配的报名者");
            return Map.of("message", "没有需要分配的报名者", "assignedCount", 0);
        }

        initializeDepartmentSlotCounts();

        int assignedCount = 0;
        List<Applicant> remainingApplicants = new ArrayList<>();

        for (Applicant applicant : unassignedApplicants) {
            AssignmentResult result = tryAssignApplicant(applicant);
            if (result.assigned) {
                assignedCount++;
            } else {
                remainingApplicants.add(applicant);
            }
        }

        log.info("分配完成，成功分配: {}, 剩余未分配: {}", assignedCount, remainingApplicants.size());

        return Map.of(
                "assignedCount", assignedCount,
                "remainingCount", remainingApplicants.size(),
                "totalApplicants", unassignedApplicants.size()
        );
    }

    private void initializeDepartmentSlotCounts() {
        List<Department> departments = departmentRepository.findByActiveTrue();
        for (Department dept : departments) {
            Long count = applicantRepository.countByAssignedDepartmentId(dept.getId());
            departmentService.setAssignedCountToRedis(dept.getId(), count);
            log.debug("初始化部门 {} 的分配数量: {}", dept.getName(), count);
        }
    }

    private AssignmentResult tryAssignApplicant(Applicant applicant) {
        List<String> preferredDepts = parseList(applicant.getPreferredDepartments());
        List<String> freeSlots = parseList(applicant.getFreeSlots());

        Set<String> usedSlotsForApplicant = getUsedSlotsForApplicant(applicant);

        for (int priority = 0; priority < preferredDepts.size(); priority++) {
            String deptName = preferredDepts.get(priority);
            Department dept = departmentRepository.findByName(deptName).orElse(null);
            
            if (dept == null || !dept.getActive()) {
                continue;
            }

            if (departmentService.isDepartmentFull(dept.getId())) {
                log.debug("部门 {} 已满员，跳过", deptName);
                continue;
            }

            String assignedSlot = findAvailableSlot(dept, freeSlots, usedSlotsForApplicant);
            if (assignedSlot != null) {
                assignApplicantToDepartment(applicant, dept, assignedSlot, priority + 1);
                usedSlotsForApplicant.add(assignedSlot);
                return new AssignmentResult(true, dept, assignedSlot);
            }
        }

        if (applicant.getAcceptAdjustment()) {
            AssignmentResult adjustResult = tryAdjustment(applicant, freeSlots, usedSlotsForApplicant);
            if (adjustResult.assigned) {
                return adjustResult;
            }
        }

        return new AssignmentResult(false, null, null);
    }

    private AssignmentResult tryAdjustment(Applicant applicant, List<String> freeSlots, Set<String> usedSlots) {
        List<Department> allDepartments = departmentRepository.findByActiveTrue();
        List<String> preferredDepts = parseList(applicant.getPreferredDepartments());

        for (Department dept : allDepartments) {
            if (preferredDepts.contains(dept.getName())) {
                continue;
            }

            if (departmentService.isDepartmentFull(dept.getId())) {
                continue;
            }

            String assignedSlot = findAvailableSlot(dept, freeSlots, usedSlots);
            if (assignedSlot != null) {
                assignApplicantToDepartment(applicant, dept, assignedSlot, 0);
                return new AssignmentResult(true, dept, assignedSlot);
            }
        }

        return new AssignmentResult(false, null, null);
    }

    private String findAvailableSlot(Department dept, List<String> applicantFreeSlots, Set<String> usedSlots) {
        List<InterviewSlot> deptSlots = interviewSlotRepository.findAvailableSlotsByDepartmentId(dept.getId());
        
        if (deptSlots.isEmpty()) {
            initializeSlotsIfNeeded(dept);
            deptSlots = interviewSlotRepository.findAvailableSlotsByDepartmentId(dept.getId());
        }

        Map<String, InterviewSlot> slotMap = deptSlots.stream()
                .collect(Collectors.toMap(InterviewSlot::getSlot, s -> s));

        for (String freeSlot : applicantFreeSlots) {
            if (usedSlots.contains(freeSlot)) {
                continue;
            }

            if (slotMap.containsKey(freeSlot)) {
                InterviewSlot slot = slotMap.get(freeSlot);
                if (slot.getCurrentCount() < slot.getMaxCapacity()) {
                    return freeSlot;
                }
            }
        }

        return null;
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

    private void assignApplicantToDepartment(Applicant applicant, Department dept, String slot, int priority) {
        InterviewSlot interviewSlot = interviewSlotRepository.findByDepartmentIdAndSlot(dept.getId(), slot)
                .orElseThrow(() -> new RuntimeException("面试时间段不存在"));

        if (interviewSlot.getCurrentCount() >= interviewSlot.getMaxCapacity()) {
            throw new RuntimeException("该时间段已满");
        }

        int updated = interviewSlotRepository.incrementCurrentCount(interviewSlot.getId());
        if (updated == 0) {
            throw new RuntimeException("分配失败，时间段已满");
        }

        applicant.setAssigned(true);
        applicant.setAssignedDepartmentId(dept.getId());
        applicant.setAssignedDepartmentName(dept.getName());
        applicant.setAssignedSlot(slot);
        applicant.setPriority(priority);
        applicantRepository.save(applicant);

        departmentService.incrementAssignedCountInRedis(dept.getId());

        log.info("分配 {}({}) 到部门 {} 时间段 {}, 优先级: {}", 
                applicant.getName(), applicant.getStudentId(), dept.getName(), slot, priority);
    }

    private Set<String> getUsedSlotsForApplicant(Applicant applicant) {
        return new HashSet<>();
    }

    private List<String> parseList(String str) {
        if (str == null || str.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(str.split(SEPARATOR));
    }

    @Transactional
    public void resetAllAllocations() {
        List<Applicant> assigned = applicantRepository.findByAssignedTrue();
        for (Applicant applicant : assigned) {
            if (applicant.getAssignedDepartmentId() != null && applicant.getAssignedSlot() != null) {
                InterviewSlot slot = interviewSlotRepository.findByDepartmentIdAndSlot(
                        applicant.getAssignedDepartmentId(), applicant.getAssignedSlot()).orElse(null);
                if (slot != null) {
                    interviewSlotRepository.decrementCurrentCount(slot.getId());
                }
            }
            
            if (applicant.getAssignedDepartmentId() != null) {
                departmentService.decrementAssignedCountInRedis(applicant.getAssignedDepartmentId());
            }

            applicant.setAssigned(false);
            applicant.setAssignedDepartmentId(null);
            applicant.setAssignedDepartmentName(null);
            applicant.setAssignedSlot(null);
            applicant.setPriority(null);
        }
        applicantRepository.saveAll(assigned);
        log.info("已重置所有分配");
    }

    private static class AssignmentResult {
        boolean assigned;
        Department department;
        String slot;

        AssignmentResult(boolean assigned, Department department, String slot) {
            this.assigned = assigned;
            this.department = department;
            this.slot = slot;
        }
    }

    public Map<String, Object> checkInterviewConflict(Long applicantId, Long targetDepartmentId, String targetSlot) {
        Applicant applicant = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("报名者不存在"));

        Department targetDept = departmentRepository.findById(targetDepartmentId)
                .orElseThrow(() -> new RuntimeException("目标部门不存在"));

        List<String> conflicts = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        List<Applicant> sameSlotApplicants = applicantRepository.findAll().stream()
                .filter(a -> !a.getId().equals(applicantId))
                .filter(a -> targetSlot.equals(a.getAssignedSlot()))
                .collect(Collectors.toList());

        if (!sameSlotApplicants.isEmpty()) {
            for (Applicant conflictApplicant : sameSlotApplicants) {
                if (conflictApplicant.getStudentId().equals(applicant.getStudentId())) {
                    conflicts.add(String.format("该报名者已在时间段 [%s] 有面试安排：%s",
                            targetSlot, conflictApplicant.getAssignedDepartmentName()));
                }
            }
        }

        initializeSlotsIfNeeded(targetDept);
        InterviewSlot targetInterviewSlot = interviewSlotRepository
                .findByDepartmentIdAndSlot(targetDepartmentId, targetSlot)
                .orElse(null);

        if (targetInterviewSlot == null) {
            conflicts.add(String.format("部门 [%s] 在时间段 [%s] 不安排面试",
                    targetDept.getName(), targetSlot));
        } else {
            boolean isSameSlot = applicant.getAssignedSlot() != null
                    && applicant.getAssignedSlot().equals(targetSlot)
                    && applicant.getAssignedDepartmentId() != null
                    && applicant.getAssignedDepartmentId().equals(targetDepartmentId);

            int currentCount = targetInterviewSlot.getCurrentCount();
            if (!isSameSlot && currentCount >= targetInterviewSlot.getMaxCapacity()) {
                conflicts.add(String.format("部门 [%s] 在时间段 [%s] 已满员（%d/%d）",
                        targetDept.getName(), targetSlot, currentCount, targetInterviewSlot.getMaxCapacity()));
            }
        }

        List<String> applicantFreeSlots = parseList(applicant.getFreeSlots());
        if (!applicantFreeSlots.contains(targetSlot)) {
            warnings.add(String.format("时间段 [%s] 不在该报名者的空闲时间段列表中", targetSlot));
        }

        if (departmentService.isDepartmentFull(targetDepartmentId)) {
            boolean isAlreadyInDept = applicant.getAssignedDepartmentId() != null
                    && applicant.getAssignedDepartmentId().equals(targetDepartmentId);
            if (!isAlreadyInDept) {
                conflicts.add(String.format("部门 [%s] 已达最大容量", targetDept.getName()));
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("hasConflict", !conflicts.isEmpty());
        result.put("conflicts", conflicts);
        result.put("hasWarning", !warnings.isEmpty());
        result.put("warnings", warnings);
        result.put("applicantName", applicant.getName());
        result.put("targetDepartment", targetDept.getName());
        result.put("targetSlot", targetSlot);

        return result;
    }

    @Transactional
    public Map<String, Object> adjustInterviewTime(Long applicantId, Long targetDepartmentId, String targetSlot) {
        Map<String, Object> conflictCheck = checkInterviewConflict(applicantId, targetDepartmentId, targetSlot);
        boolean hasConflict = (Boolean) conflictCheck.get("hasConflict");

        if (hasConflict) {
            throw new RuntimeException("存在冲突，无法调整：" + conflictCheck.get("conflicts"));
        }

        Applicant applicant = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("报名者不存在"));

        Department targetDept = departmentRepository.findById(targetDepartmentId)
                .orElseThrow(() -> new RuntimeException("目标部门不存在"));

        Long oldDepartmentId = applicant.getAssignedDepartmentId();
        String oldSlot = applicant.getAssignedSlot();
        String oldDeptName = applicant.getAssignedDepartmentName();

        if (oldDepartmentId != null && oldSlot != null) {
            InterviewSlot oldInterviewSlot = interviewSlotRepository
                    .findByDepartmentIdAndSlot(oldDepartmentId, oldSlot).orElse(null);
            if (oldInterviewSlot != null) {
                interviewSlotRepository.decrementCurrentCount(oldInterviewSlot.getId());
            }
            departmentService.decrementAssignedCountInRedis(oldDepartmentId);
        }

        InterviewSlot targetInterviewSlot = interviewSlotRepository
                .findByDepartmentIdAndSlot(targetDepartmentId, targetSlot)
                .orElseThrow(() -> new RuntimeException("目标时间段不存在"));

        int updated = interviewSlotRepository.incrementCurrentCount(targetInterviewSlot.getId());
        if (updated == 0) {
            if (oldDepartmentId != null && oldSlot != null) {
                InterviewSlot oldInterviewSlot = interviewSlotRepository
                        .findByDepartmentIdAndSlot(oldDepartmentId, oldSlot).orElse(null);
                if (oldInterviewSlot != null) {
                    interviewSlotRepository.incrementCurrentCount(oldInterviewSlot.getId());
                }
                departmentService.incrementAssignedCountInRedis(oldDepartmentId);
            }
            throw new RuntimeException("目标时间段已满，调整失败");
        }

        applicant.setAssignedDepartmentId(targetDepartmentId);
        applicant.setAssignedDepartmentName(targetDept.getName());
        applicant.setAssignedSlot(targetSlot);
        applicant.setAssigned(true);

        List<String> preferredDepts = parseList(applicant.getPreferredDepartments());
        int priorityIndex = preferredDepts.indexOf(targetDept.getName());
        applicant.setPriority(priorityIndex >= 0 ? priorityIndex + 1 : 0);

        applicantRepository.save(applicant);
        departmentService.incrementAssignedCountInRedis(targetDepartmentId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("applicantName", applicant.getName());
        result.put("studentId", applicant.getStudentId());
        result.put("oldDepartment", oldDeptName);
        result.put("oldSlot", oldSlot);
        result.put("newDepartment", targetDept.getName());
        result.put("newSlot", targetSlot);
        result.put("message", String.format("已将 %s(%s) 从 [%s %s] 调整到 [%s %s]",
                applicant.getName(), applicant.getStudentId(),
                oldDeptName, oldSlot,
                targetDept.getName(), targetSlot));

        log.info("手动调整面试时间：{}({}) 从 [{} {}] 到 [{} {}]",
                applicant.getName(), applicant.getStudentId(),
                oldDeptName, oldSlot,
                targetDept.getName(), targetSlot);

        return result;
    }
}