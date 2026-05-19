package com.military.equipment.service;

import cn.hutool.core.util.IdUtil;
import com.military.equipment.annotation.OperateLog;
import com.military.equipment.entity.ApprovalProcess;
import com.military.equipment.entity.Equipment;
import com.military.equipment.entity.StockInFlow;
import com.military.equipment.entity.StockOutLedger;
import com.military.equipment.exception.BusinessException;
import com.military.equipment.mapper.EquipmentMapper;
import com.military.equipment.mapper.StockInFlowMapper;
import com.military.equipment.mapper.StockOutLedgerMapper;
import com.military.equipment.util.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@Service
public class StockFlowService {

    @Resource
    private StockOutLedgerMapper stockOutLedgerMapper;

    @Resource
    private StockInFlowMapper stockInFlowMapper;

    @Resource
    private EquipmentMapper equipmentMapper;

    @OperateLog(module = "库存管理", type = "调拨", desc = "装备跨库房调拨")
    @Transactional(rollbackFor = Exception.class)
    public void processTransfer(ApprovalProcess process) {
        Equipment equipment = equipmentMapper.selectById(process.getEquipmentId());
        if (equipment == null) {
            throw new BusinessException("装备不存在");
        }

        String sourceDept = equipment.getCurrentDept();
        String targetDept = process.getTargetDept();

        if (sourceDept == null || sourceDept.equals(targetDept)) {
            throw new BusinessException("装备已在目标库房，无需调拨");
        }

        createStockOutLedger(equipment, process, sourceDept, targetDept);
        createStockInFlow(equipment, process, sourceDept, targetDept);
        updateEquipmentForTransfer(equipment, targetDept);
    }

    private void updateEquipmentForTransfer(Equipment equipment, String targetDept) {
        equipment.setCurrentDept(targetDept);
        equipment.setUpdatedBy(UserContext.getUserId());
        equipment.setUpdatedTime(LocalDateTime.now());

        int result = equipmentMapper.updateById(equipment);
        if (result <= 0) {
            throw new BusinessException("更新装备所属部门失败");
        }
    }

    private void createStockOutLedger(Equipment equipment, ApprovalProcess process, String sourceDept, String targetDept) {
        StockOutLedger ledger = new StockOutLedger();
        ledger.setLedgerNo("OUT" + IdUtil.getSnowflakeNextIdStr());
        ledger.setEquipmentId(equipment.getId());
        ledger.setEquipmentRfid(equipment.getRfidCode());
        ledger.setEquipmentName(equipment.getEquipmentName());
        ledger.setOutType(3);
        ledger.setSourceDept(sourceDept);
        ledger.setTargetDept(targetDept);
        ledger.setApprovalId(process.getId());
        ledger.setApprovalNo(process.getProcessNo());
        ledger.setOperatorId(UserContext.getUserId());
        ledger.setOperatorName(UserContext.getUsername());
        ledger.setOutTime(LocalDateTime.now());
        ledger.setCreatedBy(UserContext.getUserId());

        int result = stockOutLedgerMapper.insert(ledger);
        if (result <= 0) {
            throw new BusinessException("创建出库台账失败");
        }
    }

    private void createStockInFlow(Equipment equipment, ApprovalProcess process, String sourceDept, String targetDept) {
        StockInFlow flow = new StockInFlow();
        flow.setFlowNo("IN" + IdUtil.getSnowflakeNextIdStr());
        flow.setEquipmentId(equipment.getId());
        flow.setEquipmentRfid(equipment.getRfidCode());
        flow.setEquipmentName(equipment.getEquipmentName());
        flow.setInType(3);
        flow.setSourceDept(sourceDept);
        flow.setTargetDept(targetDept);
        flow.setApprovalId(process.getId());
        flow.setApprovalNo(process.getProcessNo());
        flow.setOperatorId(UserContext.getUserId());
        flow.setOperatorName(UserContext.getUsername());
        flow.setInTime(LocalDateTime.now());
        flow.setCreatedBy(UserContext.getUserId());

        int result = stockInFlowMapper.insert(flow);
        if (result <= 0) {
            throw new BusinessException("创建入库流水失败");
        }
    }

    @OperateLog(module = "库存管理", type = "领用", desc = "装备领用出库")
    @Transactional(rollbackFor = Exception.class)
    public void processBorrow(ApprovalProcess process) {
        Equipment equipment = equipmentMapper.selectById(process.getEquipmentId());
        if (equipment == null) {
            throw new BusinessException("装备不存在");
        }

        StockOutLedger ledger = new StockOutLedger();
        ledger.setLedgerNo("OUT" + IdUtil.getSnowflakeNextIdStr());
        ledger.setEquipmentId(equipment.getId());
        ledger.setEquipmentRfid(equipment.getRfidCode());
        ledger.setEquipmentName(equipment.getEquipmentName());
        ledger.setOutType(1);
        ledger.setSourceDept(equipment.getCurrentDept());
        ledger.setTargetDept(process.getApplicantDept());
        ledger.setApprovalId(process.getId());
        ledger.setApprovalNo(process.getProcessNo());
        ledger.setOperatorId(UserContext.getUserId());
        ledger.setOperatorName(UserContext.getUsername());
        ledger.setOutTime(LocalDateTime.now());
        ledger.setCreatedBy(UserContext.getUserId());

        int result = stockOutLedgerMapper.insert(ledger);
        if (result <= 0) {
            throw new BusinessException("创建出库台账失败");
        }

        equipment.setEquipmentStatus(2);
        equipment.setCurrentUserId(process.getApplicantId());
        equipment.setCurrentUserName(process.getApplicantName());
        equipment.setUpdatedBy(UserContext.getUserId());
        equipment.setUpdatedTime(LocalDateTime.now());

        result = equipmentMapper.updateById(equipment);
        if (result <= 0) {
            throw new BusinessException("更新装备状态失败");
        }
    }

    @OperateLog(module = "库存管理", type = "归还", desc = "装备归还入库")
    @Transactional(rollbackFor = Exception.class)
    public void processReturn(ApprovalProcess process) {
        Equipment equipment = equipmentMapper.selectById(process.getEquipmentId());
        if (equipment == null) {
            throw new BusinessException("装备不存在");
        }

        StockInFlow flow = new StockInFlow();
        flow.setFlowNo("IN" + IdUtil.getSnowflakeNextIdStr());
        flow.setEquipmentId(equipment.getId());
        flow.setEquipmentRfid(equipment.getRfidCode());
        flow.setEquipmentName(equipment.getEquipmentName());
        flow.setInType(2);
        flow.setSourceDept(process.getApplicantDept());
        flow.setTargetDept(equipment.getCurrentDept());
        flow.setApprovalId(process.getId());
        flow.setApprovalNo(process.getProcessNo());
        flow.setOperatorId(UserContext.getUserId());
        flow.setOperatorName(UserContext.getUsername());
        flow.setInTime(LocalDateTime.now());
        flow.setCreatedBy(UserContext.getUserId());

        int result = stockInFlowMapper.insert(flow);
        if (result <= 0) {
            throw new BusinessException("创建入库流水失败");
        }

        equipment.setEquipmentStatus(1);
        equipment.setCurrentUserId(null);
        equipment.setCurrentUserName(null);
        equipment.setUpdatedBy(UserContext.getUserId());
        equipment.setUpdatedTime(LocalDateTime.now());

        result = equipmentMapper.updateById(equipment);
        if (result <= 0) {
            throw new BusinessException("更新装备状态失败");
        }
    }
}
