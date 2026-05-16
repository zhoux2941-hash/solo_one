package com.hrbonus.service;

import com.hrbonus.dto.AppealRequest;
import com.hrbonus.dto.ProcessAppealRequest;
import com.hrbonus.entity.*;
import com.hrbonus.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppealService {

    @Autowired
    private AppealRepository appealRepository;

    @Autowired
    private BonusAllocationRepository allocationRepository;

    @Autowired
    private BonusPoolRepository bonusPoolRepository;

    @Autowired
    private BonusVersionRepository versionRepository;

    @Transactional
    public Appeal createAppeal(AppealRequest request) {
        if (request.getAllocationId() == null) {
            throw new RuntimeException("分配记录ID不能为空");
        }
        if (request.getEmployeeId() == null) {
            throw new RuntimeException("员工ID不能为空");
        }
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new RuntimeException("申诉原因不能为空");
        }
        
        BonusAllocation allocation = allocationRepository.findById(request.getAllocationId())
                .orElseThrow(() -> new RuntimeException("分配记录不存在"));
        
        if (allocation.getHasAppeal()) {
            throw new RuntimeException("该分配已存在申诉");
        }
        if (allocation.getIsFrozen()) {
            throw new RuntimeException("该分配已被冻结，无法重复申诉");
        }

        Appeal appeal = new Appeal();
        appeal.setAllocationId(request.getAllocationId());
        appeal.setEmployeeId(request.getEmployeeId());
        appeal.setReason(request.getReason());
        appeal.setStatus(Appeal.AppealStatus.PENDING);

        allocation.setIsFrozen(true);
        allocation.setHasAppeal(true);
        allocation.setStatus(BonusAllocation.AllocationStatus.APPEALED);
        allocationRepository.save(allocation);

        return appealRepository.save(appeal);
    }

    @Transactional
    public Appeal processAppeal(ProcessAppealRequest request) {
        if (request.getAppealId() == null) {
            throw new RuntimeException("申诉ID不能为空");
        }
        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            throw new RuntimeException("处理状态不能为空");
        }
        
        Appeal appeal = appealRepository.findById(request.getAppealId())
                .orElseThrow(() -> new RuntimeException("申诉不存在"));

        BonusAllocation allocation = allocationRepository.findById(appeal.getAllocationId())
                .orElseThrow(() -> new RuntimeException("分配记录不存在"));

        appeal.setStatus(Appeal.AppealStatus.valueOf(request.getStatus()));
        appeal.setManagerComment(request.getManagerComment());
        appeal.setProcessedAt(LocalDateTime.now());

        if ("RESOLVED".equals(request.getStatus()) && request.getNewPercentage() != null) {
            if (request.getNewPercentage().compareTo(BigDecimal.ZERO) < 0 || 
                request.getNewPercentage().compareTo(new BigDecimal("100")) > 0) {
                throw new RuntimeException("分配比例必须在0-100之间");
            }
            
            BonusPool pool = bonusPoolRepository.findById(allocation.getBonusPoolId())
                    .orElseThrow(() -> new RuntimeException("奖金池不存在"));

            BonusVersion version = new BonusVersion();
            version.setBonusPoolId(allocation.getBonusPoolId());
            version.setAllocationId(allocation.getId());
            version.setEmployeeId(allocation.getEmployeeId());
            version.setVersionNumber(allocation.getVersionNumber());
            version.setPercentage(allocation.getPercentage());
            version.setAmount(allocation.getAmount());
            version.setChangeReason(request.getChangeReason());
            version.setChangedBy(request.getManagerId());
            versionRepository.save(version);

            BigDecimal newAmount = pool.getTotalAmount()
                    .multiply(request.getNewPercentage())
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);

            allocation.setPercentage(request.getNewPercentage());
            allocation.setAmount(newAmount);
            allocation.setVersionNumber(allocation.getVersionNumber() + 1);
            allocation.setStatus(BonusAllocation.AllocationStatus.ADJUSTED);
        }

        allocation.setIsFrozen(false);
        allocationRepository.save(allocation);

        return appealRepository.save(appeal);
    }

    public List<Appeal> getPendingAppeals() {
        return appealRepository.findByStatus(Appeal.AppealStatus.PENDING);
    }

    public List<Appeal> getEmployeeAppeals(Long employeeId) {
        return appealRepository.findByEmployeeId(employeeId);
    }
}
