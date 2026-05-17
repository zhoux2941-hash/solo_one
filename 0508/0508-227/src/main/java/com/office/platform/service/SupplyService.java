package com.office.platform.service;

import com.office.platform.common.Result;
import com.office.platform.dto.SupplyDTO;
import com.office.platform.dto.SupplyRecordDTO;
import com.office.platform.entity.Supply;
import com.office.platform.entity.SupplyRecord;
import com.office.platform.entity.User;
import com.office.platform.repository.SupplyRecordRepository;
import com.office.platform.repository.SupplyRepository;
import com.office.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplyService {

    @Autowired
    private SupplyRepository supplyRepository;

    @Autowired
    private SupplyRecordRepository supplyRecordRepository;

    @Autowired
    private UserRepository userRepository;

    public Page<Supply> getSupplyList(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "updateTime"));
        return supplyRepository.findAll(pageable);
    }

    public List<Supply> getLowStockSupplies() {
        return supplyRepository.findLowStockSupplies();
    }

    public long getLowStockCount() {
        return supplyRepository.countLowStockSupplies();
    }

    public Supply getSupplyById(Long id) {
        return supplyRepository.findById(id).orElse(null);
    }

    public Page<SupplyRecord> getSupplyRecords(Long supplyId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return supplyRecordRepository.findBySupplyIdOrderByCreateTimeDesc(supplyId, pageable);
    }

    @Transactional
    public Result<Supply> createSupply(SupplyDTO dto) {
        Supply supply = new Supply();
        supply.setName(dto.getName());
        supply.setCategory(dto.getCategory());
        supply.setQuantity(dto.getQuantity());
        supply.setMinWarning(dto.getMinWarning());
        supply.setDescription(dto.getDescription());

        supply = supplyRepository.save(supply);
        return Result.success("创建成功", supply);
    }

    @Transactional
    public Result<Supply> updateSupply(Long id, SupplyDTO dto) {
        Supply supply = supplyRepository.findById(id).orElse(null);
        if (supply == null) {
            return Result.error("用品不存在");
        }

        supply.setName(dto.getName());
        supply.setCategory(dto.getCategory());
        supply.setQuantity(dto.getQuantity());
        supply.setMinWarning(dto.getMinWarning());
        supply.setDescription(dto.getDescription());

        supply = supplyRepository.save(supply);
        return Result.success("更新成功", supply);
    }

    @Transactional
    public Result<String> deleteSupply(Long id) {
        if (!supplyRepository.existsById(id)) {
            return Result.error("用品不存在");
        }
        supplyRepository.deleteById(id);
        return Result.success("删除成功");
    }

    @Transactional
    public Result<SupplyRecord> stockIn(SupplyRecordDTO dto, Long operatorId) {
        Supply supply = supplyRepository.findById(dto.getSupplyId()).orElse(null);
        if (supply == null) {
            return Result.error("用品不存在");
        }

        User operator = userRepository.findById(operatorId).orElse(null);
        if (operator == null) {
            return Result.error("操作员不存在");
        }

        supply.setQuantity(supply.getQuantity() + dto.getQuantity());
        supplyRepository.save(supply);

        SupplyRecord record = new SupplyRecord();
        record.setSupply(supply);
        record.setType("入库");
        record.setQuantity(dto.getQuantity());
        record.setRemark(dto.getRemark());
        record.setOperator(operator);

        record = supplyRecordRepository.save(record);
        return Result.success("入库成功", record);
    }

    @Transactional
    public Result<SupplyRecord> stockOut(SupplyRecordDTO dto, Long operatorId) {
        Supply supply = supplyRepository.findById(dto.getSupplyId()).orElse(null);
        if (supply == null) {
            return Result.error("用品不存在");
        }

        if (supply.getQuantity() < dto.getQuantity()) {
            return Result.error("库存不足");
        }

        User operator = userRepository.findById(operatorId).orElse(null);
        if (operator == null) {
            return Result.error("操作员不存在");
        }

        supply.setQuantity(supply.getQuantity() - dto.getQuantity());
        supplyRepository.save(supply);

        SupplyRecord record = new SupplyRecord();
        record.setSupply(supply);
        record.setType("出库");
        record.setQuantity(dto.getQuantity());
        record.setRemark(dto.getRemark());
        record.setOperator(operator);

        record = supplyRecordRepository.save(record);
        return Result.success("出库成功", record);
    }
}
