package com.hrbonus.service;

import com.hrbonus.dto.AllocationRequest;
import com.hrbonus.dto.BatchAllocationRequest;
import com.hrbonus.dto.VersionDiff;
import com.hrbonus.entity.*;
import com.hrbonus.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BonusAllocationService {

    @Autowired
    private BonusAllocationRepository allocationRepository;

    @Autowired
    private BonusPoolRepository bonusPoolRepository;

    @Autowired
    private BonusVersionRepository versionRepository;

    @Autowired
    private UserRepository userRepository;

    private static final BigDecimal MAX_PERCENTAGE = new BigDecimal("100");

    @Transactional
    public List<BonusAllocation> batchAllocate(BatchAllocationRequest request) {
        if (request.getBonusPoolId() == null) {
            throw new RuntimeException("奖金池ID不能为空");
        }
        if (request.getAllocations() == null || request.getAllocations().isEmpty()) {
            throw new RuntimeException("分配数据不能为空");
        }
        
        BonusPool pool = bonusPoolRepository.findById(request.getBonusPoolId())
                .orElseThrow(() -> new RuntimeException("奖金池不存在"));

        for (AllocationRequest alloc : request.getAllocations()) {
            if (alloc.getPercentage() == null) {
                throw new RuntimeException("员工 " + alloc.getEmployeeId() + " 的分配比例不能为空");
            }
            if (alloc.getPercentage().compareTo(BigDecimal.ZERO) < 0 || 
                alloc.getPercentage().compareTo(MAX_PERCENTAGE) > 0) {
                throw new RuntimeException("员工 " + alloc.getEmployeeId() + " 的分配比例必须在0-100之间");
            }
        }

        BigDecimal totalPercentage = request.getAllocations().stream()
                .map(AllocationRequest::getPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPercentage.compareTo(MAX_PERCENTAGE) > 0) {
            throw new RuntimeException("分配比例总和不能超过100%");
        }

        List<BonusAllocation> results = new ArrayList<>();
        for (AllocationRequest alloc : request.getAllocations()) {
            Optional<BonusAllocation> existing = allocationRepository
                    .findByBonusPoolIdAndEmployeeId(request.getBonusPoolId(), alloc.getEmployeeId());

            User employee = userRepository.findById(alloc.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("员工不存在"));

            BigDecimal amount = pool.getTotalAmount()
                    .multiply(alloc.getPercentage())
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);

            BonusAllocation allocation;
            if (existing.isPresent()) {
                allocation = existing.get();
                if (allocation.getIsFrozen()) {
                    continue;
                }
                saveVersion(allocation, request.getChangeReason(), request.getChangedBy());
                allocation.setPercentage(alloc.getPercentage());
                allocation.setAmount(amount);
                allocation.setVersionNumber(allocation.getVersionNumber() + 1);
                allocation.setRemarks(alloc.getRemarks());
            } else {
                allocation = new BonusAllocation();
                allocation.setBonusPoolId(request.getBonusPoolId());
                allocation.setEmployeeId(alloc.getEmployeeId());
                allocation.setEmployeeName(employee.getName());
                allocation.setPercentage(alloc.getPercentage());
                allocation.setAmount(amount);
                allocation.setVersionNumber(1);
                allocation.setStatus(BonusAllocation.AllocationStatus.DRAFT);
                allocation.setIsFrozen(false);
                allocation.setHasAppeal(false);
                allocation.setRemarks(alloc.getRemarks());
            }
            results.add(allocationRepository.save(allocation));
        }
        return results;
    }

    private void saveVersion(BonusAllocation allocation, String reason, Long changedBy) {
        BonusVersion version = new BonusVersion();
        version.setBonusPoolId(allocation.getBonusPoolId());
        version.setAllocationId(allocation.getId());
        version.setEmployeeId(allocation.getEmployeeId());
        version.setVersionNumber(allocation.getVersionNumber());
        version.setPercentage(allocation.getPercentage());
        version.setAmount(allocation.getAmount());
        version.setChangeReason(reason);
        version.setChangedBy(changedBy);
        versionRepository.save(version);
    }

    public List<BonusAllocation> getPoolAllocations(Long poolId) {
        return allocationRepository.findByBonusPoolId(poolId);
    }

    public List<BonusAllocation> getEmployeeAllocations(Long employeeId) {
        return allocationRepository.findByEmployeeId(employeeId);
    }

    public List<BonusVersion> getAllocationVersions(Long allocationId) {
        return versionRepository.findByAllocationIdOrderByVersionNumberDesc(allocationId);
    }

    public List<VersionDiff> compareVersions(Long allocationId, Integer v1, Integer v2) {
        if (allocationId == null) {
            throw new RuntimeException("分配记录ID不能为空");
        }
        if (v1 == null || v2 == null) {
            throw new RuntimeException("版本号不能为空");
        }
        List<BonusVersion> versions = versionRepository.findByAllocationIdOrderByVersionNumberDesc(allocationId);
        List<VersionDiff> diffs = new ArrayList<>();

        BonusVersion version1 = versions.stream()
                .filter(v -> v.getVersionNumber().equals(v1))
                .findFirst()
                .orElse(null);

        BonusVersion version2 = versions.stream()
                .filter(v -> v.getVersionNumber().equals(v2))
                .findFirst()
                .orElse(null);

        if (version1 != null && version2 != null) {
            VersionDiff diff = new VersionDiff();
            diff.setEmployeeId(version1.getEmployeeId());
            diff.setOldPercentage(version1.getPercentage());
            diff.setNewPercentage(version2.getPercentage());
            diff.setOldAmount(version1.getAmount());
            diff.setNewAmount(version2.getAmount());
            diff.setChangeReason(version2.getChangeReason());
            diffs.add(diff);
        } else {
            throw new RuntimeException("未找到指定的版本记录");
        }
        return diffs;
    }

    public BonusAllocation confirmAllocation(Long allocationId) {
        if (allocationId == null) {
            throw new RuntimeException("分配记录ID不能为空");
        }
        BonusAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new RuntimeException("分配记录不存在"));
        allocation.setStatus(BonusAllocation.AllocationStatus.CONFIRMED);
        return allocationRepository.save(allocation);
    }
}
