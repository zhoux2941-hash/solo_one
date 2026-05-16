package com.hrbonus.service;

import com.hrbonus.entity.*;
import com.hrbonus.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class BonusPoolService {

    @Autowired
    private BonusPoolRepository bonusPoolRepository;

    @Autowired
    private BonusAllocationRepository allocationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BonusVersionRepository versionRepository;

    private static final BigDecimal MAX_AMOUNT = new BigDecimal("999999999.99");

    public BonusPool createBonusPool(BonusPool pool) {
        if (pool.getDepartmentId() == null) {
            throw new RuntimeException("部门ID不能为空");
        }
        if (pool.getTotalAmount() == null || pool.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("奖金金额必须大于0");
        }
        if (pool.getTotalAmount().compareTo(MAX_AMOUNT) > 0) {
            throw new RuntimeException("奖金金额不能超过999,999,999.99");
        }
        if (pool.getQuarterYear() == null) {
            throw new RuntimeException("年份不能为空");
        }
        if (pool.getQuarterNumber() == null) {
            throw new RuntimeException("季度不能为空");
        }
        pool.setStatus(BonusPool.PoolStatus.DRAFT);
        pool.setIsArchived(false);
        return bonusPoolRepository.save(pool);
    }

    public List<BonusPool> getDepartmentPools(Long departmentId) {
        return bonusPoolRepository.findByDepartmentId(departmentId);
    }

    public Optional<BonusPool> getPoolById(Long id) {
        return bonusPoolRepository.findById(id);
    }

    public BonusPool updatePoolStatus(Long poolId, BonusPool.PoolStatus status) {
        BonusPool pool = bonusPoolRepository.findById(poolId)
                .orElseThrow(() -> new RuntimeException("奖金池不存在"));
        pool.setStatus(status);
        return bonusPoolRepository.save(pool);
    }
}
