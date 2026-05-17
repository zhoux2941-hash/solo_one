package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.Material;
import com.construction.entity.MaterialInOut;
import com.construction.entity.MaterialInventory;
import com.construction.repository.MaterialInOutRepository;
import com.construction.repository.MaterialInventoryRepository;
import com.construction.repository.MaterialRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class MaterialInOutService {

    @Resource
    private MaterialInOutRepository materialInOutRepository;

    @Resource
    private MaterialInventoryRepository materialInventoryRepository;

    @Resource
    private MaterialRepository materialRepository;

    public Result<PageResult<MaterialInOut>> getInOutList(Integer pageNum, Integer pageSize, String billType, Long projectId, Long materialId) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Specification<MaterialInOut> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (materialId != null) {
                predicates.add(criteriaBuilder.equal(root.get("materialId"), materialId));
            }

            if (StringUtils.hasText(billType)) {
                predicates.add(criteriaBuilder.equal(root.get("billType"), billType));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<MaterialInOut> page = materialInOutRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<MaterialInOut> getInOutById(Long id) {
        MaterialInOut inOut = materialInOutRepository.findById(id).orElse(null);
        if (inOut == null) {
            return Result.error("单据不存在");
        }
        return Result.success(inOut);
    }

    @Transactional
    public Result<MaterialInOut> createInOut(MaterialInOut inOut) {
        Material material = materialRepository.findById(inOut.getMaterialId()).orElse(null);
        if (material == null) {
            return Result.error("物料不存在");
        }

        String billNo = generateBillNo(inOut.getBillType());
        inOut.setBillNo(billNo);
        inOut.setId(null);

        if (inOut.getUnitPrice() != null && inOut.getQuantity() != null) {
            inOut.setTotalAmount(inOut.getUnitPrice().multiply(inOut.getQuantity()));
        }

        MaterialInOut saved = materialInOutRepository.save(inOut);
        updateInventory(inOut.getMaterialId(), inOut.getBillType(), inOut.getQuantity());

        return Result.success("创建成功", saved);
    }

    @Transactional
    public Result<Void> deleteInOut(Long id) {
        MaterialInOut inOut = materialInOutRepository.findById(id).orElse(null);
        if (inOut == null) {
            return Result.error("单据不存在");
        }

        String reverseType = getReverseBillType(inOut.getBillType());
        updateInventory(inOut.getMaterialId(), reverseType, inOut.getQuantity());

        materialInOutRepository.deleteById(id);
        return Result.success("删除成功");
    }

    private String generateBillNo(String billType) {
        String prefix = "";
        switch (billType) {
            case "IN":
                prefix = "RK";
                break;
            case "OUT":
                prefix = "CK";
                break;
            case "RETURN":
                prefix = "TK";
                break;
            default:
                prefix = "QD";
        }
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return prefix + dateStr;
    }

    private String getReverseBillType(String billType) {
        switch (billType) {
            case "IN":
                return "OUT";
            case "OUT":
                return "IN";
            case "RETURN":
                return "OUT";
            default:
                return billType;
        }
    }

    private void updateInventory(Long materialId, String billType, BigDecimal quantity) {
        MaterialInventory inventory = materialInventoryRepository.findByMaterialId(materialId).orElse(null);
        if (inventory == null) {
            inventory = new MaterialInventory();
            inventory.setMaterialId(materialId);
            Material material = materialRepository.findById(materialId).orElse(null);
            if (material != null) {
                inventory.setProjectId(material.getProjectId());
            }
        }

        BigDecimal currentQuantity = inventory.getCurrentQuantity();
        if (currentQuantity == null) {
            currentQuantity = BigDecimal.ZERO;
        }

        switch (billType) {
            case "IN":
                inventory.setCurrentQuantity(currentQuantity.add(quantity));
                inventory.setTotalInQuantity(inventory.getTotalInQuantity().add(quantity));
                inventory.setLastInTime(LocalDateTime.now());
                break;
            case "OUT":
                inventory.setCurrentQuantity(currentQuantity.subtract(quantity));
                inventory.setTotalOutQuantity(inventory.getTotalOutQuantity().add(quantity));
                inventory.setLastOutTime(LocalDateTime.now());
                break;
            case "RETURN":
                inventory.setCurrentQuantity(currentQuantity.add(quantity));
                inventory.setTotalReturnQuantity(inventory.getTotalReturnQuantity().add(quantity));
                break;
        }

        materialInventoryRepository.save(inventory);
    }

    public Result<List<MaterialInventory>> getInventoryList(Long projectId, Boolean lowStockOnly) {
        List<MaterialInventory> inventories = materialInventoryRepository.findByProjectId(projectId);

        if (lowStockOnly != null && lowStockOnly) {
            List<MaterialInventory> lowStockList = new ArrayList<>();
            for (MaterialInventory inv : inventories) {
                Material material = materialRepository.findById(inv.getMaterialId()).orElse(null);
                if (material != null && material.getMinStockQuantity() != null) {
                    if (inv.getCurrentQuantity().compareTo(material.getMinStockQuantity()) <= 0) {
                        lowStockList.add(inv);
                    }
                }
            }
            return Result.success(lowStockList);
        }

        return Result.success(inventories);
    }

    public Result<MaterialInventory> getInventoryByMaterialId(Long materialId) {
        MaterialInventory inventory = materialInventoryRepository.findByMaterialId(materialId).orElse(null);
        if (inventory == null) {
            return Result.error("库存记录不存在");
        }
        return Result.success(inventory);
    }
}
