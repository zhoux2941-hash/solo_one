package com.military.equipment.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.military.equipment.annotation.OperateLog;
import com.military.equipment.common.PageQuery;
import com.military.equipment.dto.ApprovalApplyDTO;
import com.military.equipment.dto.ApprovalAuditDTO;
import com.military.equipment.entity.ApprovalProcess;
import com.military.equipment.entity.Equipment;
import com.military.equipment.exception.BusinessException;
import com.military.equipment.mapper.ApprovalProcessMapper;
import com.military.equipment.mapper.EquipmentMapper;
import com.military.equipment.mapper.SysUserMapper;
import com.military.equipment.util.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@Service
public class ApprovalProcessService {

    @Resource
    private ApprovalProcessMapper approvalProcessMapper;

    @Resource
    private EquipmentMapper equipmentMapper;

    @Resource
    private SysUserMapper sysUserMapper;

    @Resource
    private StockFlowService stockFlowService;

    public Page<ApprovalProcess> myList(Integer processType, Integer status, PageQuery pageQuery) {
        QueryWrapper<ApprovalProcess> wrapper = new QueryWrapper<>();
        wrapper.eq("applicant_id", UserContext.getUserId());
        if (processType != null) {
            wrapper.eq("process_type", processType);
        }
        if (status != null) {
            wrapper.eq("process_status", status);
        }
        wrapper.orderByDesc("created_time");

        Page<ApprovalProcess> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        return approvalProcessMapper.selectPage(page, wrapper);
    }

    public Page<ApprovalProcess> pendingList(Integer processType, PageQuery pageQuery) {
        QueryWrapper<ApprovalProcess> wrapper = new QueryWrapper<>();
        String roleCode = UserContext.getRoleCode();

        if ("WAREHOUSE_KEEPER".equals(roleCode)) {
            wrapper.eq("current_step", 1)
                    .eq("process_status", 0);
        } else if ("AUDITOR".equals(roleCode)) {
            wrapper.eq("current_step", 2)
                    .eq("process_status", 0);
        } else if ("ADMIN".equals(roleCode)) {
            wrapper.eq("process_status", 0);
        }

        if (processType != null) {
            wrapper.eq("process_type", processType);
        }
        wrapper.orderByDesc("created_time");

        Page<ApprovalProcess> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        return approvalProcessMapper.selectPage(page, wrapper);
    }

    public Page<ApprovalProcess> historyList(Integer processType, Integer status, PageQuery pageQuery) {
        QueryWrapper<ApprovalProcess> wrapper = new QueryWrapper<>();
        if (processType != null) {
            wrapper.eq("process_type", processType);
        }
        if (status != null) {
            wrapper.eq("process_status", status);
        }
        wrapper.orderByDesc("created_time");

        Page<ApprovalProcess> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        return approvalProcessMapper.selectPage(page, wrapper);
    }

    @OperateLog(module = "审批管理", type = "申请", desc = "提交审批申请")
    @Transactional(rollbackFor = Exception.class)
    public void apply(ApprovalApplyDTO dto) {
        Equipment equipment = equipmentMapper.selectById(dto.getEquipmentId());
        if (equipment == null) {
            throw new BusinessException("装备不存在");
        }

        if (dto.getProcessType() == 1 && equipment.getEquipmentStatus() != 1) {
            throw new BusinessException("装备不在库，无法领用");
        }

        ApprovalProcess process = new ApprovalProcess();
        process.setProcessNo("AP" + IdUtil.getSnowflakeNextIdStr());
        process.setProcessType(dto.getProcessType());
        process.setEquipmentId(equipment.getId());
        process.setEquipmentRfid(equipment.getRfidCode());
        process.setEquipmentName(equipment.getEquipmentName());
        process.setApplicantId(UserContext.getUserId());
        process.setApplicantName(UserContext.getUsername());
        process.setApplyReason(dto.getApplyReason());
        process.setApplyTime(LocalDateTime.now());
        process.setExpectReturnDate(dto.getExpectReturnDate());
        process.setTargetDept(dto.getTargetDept());
        process.setCurrentStep(1);
        process.setProcessStatus(0);

        approvalProcessMapper.insert(process);
    }

    @OperateLog(module = "审批管理", type = "审批", desc = "审批流程")
    @Transactional(rollbackFor = Exception.class)
    public void audit(ApprovalAuditDTO dto) {
        ApprovalProcess process = approvalProcessMapper.selectById(dto.getId());
        if (process == null) {
            throw new BusinessException("审批流程不存在");
        }

        if (process.getProcessStatus() != 0) {
            throw new BusinessException("审批流程已处理");
        }

        String roleCode = UserContext.getRoleCode();
        Integer currentStep = process.getCurrentStep();

        if ("WAREHOUSE_KEEPER".equals(roleCode) && currentStep != 1) {
            throw new BusinessException("无权审批此步骤");
        }
        if ("AUDITOR".equals(roleCode) && currentStep != 2) {
            throw new BusinessException("无权审批此步骤");
        }

        if (dto.getResult() == 0) {
            process.setProcessStatus(2);
            process.setFinalStatus(0);
            process.setCloseTime(LocalDateTime.now());
        } else {
            if (currentStep == 1) {
                process.setCurrentStep(2);
            } else if (currentStep == 2) {
                process.setProcessStatus(1);
                process.setFinalStatus(1);
                process.setCloseTime(LocalDateTime.now());
                processStockFlow(process);
            }
        }

        if ("WAREHOUSE_KEEPER".equals(roleCode)) {
            process.setWarehouseKeeperId(UserContext.getUserId());
            process.setWarehouseKeeperName(UserContext.getUsername());
            process.setWarehouseKeeperRemark(dto.getRemark());
            process.setWarehouseKeeperTime(LocalDateTime.now());
        } else if ("AUDITOR".equals(roleCode)) {
            process.setAuditorId(UserContext.getUserId());
            process.setAuditorName(UserContext.getUsername());
            process.setAuditorRemark(dto.getRemark());
            process.setAuditorTime(LocalDateTime.now());
        }

        approvalProcessMapper.updateById(process);
    }

    private void processStockFlow(ApprovalProcess process) {
        switch (process.getProcessType()) {
            case 1:
                stockFlowService.processBorrow(process);
                break;
            case 2:
                stockFlowService.processReturn(process);
                break;
            case 3:
                stockFlowService.processTransfer(process);
                break;
        }
    }

    public ApprovalProcess getById(Long id) {
        return approvalProcessMapper.selectById(id);
    }

    @OperateLog(module = "审批管理", type = "撤回", desc = "撤回审批申请")
    @Transactional(rollbackFor = Exception.class)
    public void withdraw(Long id) {
        ApprovalProcess process = approvalProcessMapper.selectById(id);
        if (process == null) {
            throw new BusinessException("审批流程不存在");
        }

        if (!process.getApplicantId().equals(UserContext.getUserId())) {
            throw new BusinessException("只能撤回自己的申请");
        }

        if (process.getProcessStatus() != 0) {
            throw new BusinessException("流程已处理，无法撤回");
        }

        process.setProcessStatus(3);
        process.setCloseTime(LocalDateTime.now());
        approvalProcessMapper.updateById(process);
    }
}
