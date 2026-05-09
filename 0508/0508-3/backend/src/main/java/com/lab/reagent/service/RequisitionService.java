package com.lab.reagent.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lab.reagent.dto.MonthlyStatsDTO;
import com.lab.reagent.entity.Requisition;
import com.lab.reagent.entity.RequisitionRecord;
import com.lab.reagent.mapper.RequisitionMapper;
import com.lab.reagent.mapper.RequisitionRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class RequisitionService {
    @Autowired
    private RequisitionMapper requisitionMapper;

    @Autowired
    private RequisitionRecordMapper recordMapper;

    @Autowired
    private ReagentService reagentService;

    public List<Requisition> getAll() {
        return requisitionMapper.selectAllWithDetails();
    }

    public List<Requisition> getByUserId(Long userId) {
        QueryWrapper<Requisition> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).orderByDesc("create_time");
        return requisitionMapper.selectList(wrapper);
    }

    public List<Requisition> getPending() {
        QueryWrapper<Requisition> wrapper = new QueryWrapper<>();
        wrapper.eq("status", "pending").orderByDesc("create_time");
        return requisitionMapper.selectAllWithDetails().stream()
                .filter(r -> "pending".equals(r.getStatus()))
                .toList();
    }

    public Requisition getById(Long id) {
        return requisitionMapper.selectById(id);
    }

    public boolean createRequisition(Requisition requisition) {
        requisition.setStatus("pending");
        requisition.setCreateTime(LocalDateTime.now());
        requisition.setUpdateTime(LocalDateTime.now());
        return requisitionMapper.insert(requisition) > 0;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean approve(Long id, Long approverId, String remark) {
        Requisition requisition = requisitionMapper.selectById(id);
        if (requisition == null || !"pending".equals(requisition.getStatus())) {
            return false;
        }

        if (!reagentService.decreaseStock(requisition.getReagentId(), requisition.getQuantity())) {
            return false;
        }

        requisition.setStatus("approved");
        requisition.setApproverId(approverId);
        requisition.setRemark(remark);
        requisition.setUpdateTime(LocalDateTime.now());
        requisitionMapper.updateById(requisition);

        RequisitionRecord record = new RequisitionRecord();
        record.setRequisitionId(id);
        record.setUserId(requisition.getUserId());
        record.setReagentId(requisition.getReagentId());
        record.setQuantity(requisition.getQuantity());
        record.setPurpose(requisition.getPurpose());
        record.setOperationType("approved");
        record.setOperationTime(LocalDateTime.now());
        record.setOperatorId(approverId);
        recordMapper.insert(record);

        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean reject(Long id, Long approverId, String remark) {
        Requisition requisition = requisitionMapper.selectById(id);
        if (requisition == null || !"pending".equals(requisition.getStatus())) {
            return false;
        }

        requisition.setStatus("rejected");
        requisition.setApproverId(approverId);
        requisition.setRemark(remark);
        requisition.setUpdateTime(LocalDateTime.now());
        requisitionMapper.updateById(requisition);

        RequisitionRecord record = new RequisitionRecord();
        record.setRequisitionId(id);
        record.setUserId(requisition.getUserId());
        record.setReagentId(requisition.getReagentId());
        record.setQuantity(requisition.getQuantity());
        record.setPurpose(requisition.getPurpose());
        record.setOperationType("rejected");
        record.setOperationTime(LocalDateTime.now());
        record.setOperatorId(approverId);
        recordMapper.insert(record);

        return true;
    }

    public List<RequisitionRecord> searchRecords(String category, String startDate, String endDate, Long userId) {
        return recordMapper.searchRecords(category, startDate, endDate, userId);
    }

    public List<MonthlyStatsDTO> getMonthlyStats(String yearMonth) {
        if (yearMonth == null || yearMonth.isEmpty()) {
            yearMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        }
        return recordMapper.getMonthlyStats(yearMonth);
    }
}
