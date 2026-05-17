package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.ProductionLine;
import com.factory.repository.ProductionLineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductionLineService {

    @Autowired
    private ProductionLineRepository productionLineRepository;

    public Result<Page<ProductionLine>> findAll(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<ProductionLine> lines;
        
        if (keyword != null && !keyword.isEmpty()) {
            lines = productionLineRepository.findByLineNameContaining(keyword, pageable);
        } else {
            lines = productionLineRepository.findAll(pageable);
        }
        
        return Result.success(lines);
    }

    public Result<List<ProductionLine>> findByWorkshopId(Long workshopId) {
        return Result.success(productionLineRepository.findByWorkshopId(workshopId));
    }

    public Result<ProductionLine> findById(Long id) {
        Optional<ProductionLine> line = productionLineRepository.findById(id);
        return line.map(Result::success).orElseGet(() -> Result.error("生产线不存在"));
    }

    public Result<ProductionLine> save(ProductionLine line) {
        if (productionLineRepository.existsByLineCode(line.getLineCode())) {
            return Result.error("生产线编码已存在");
        }
        ProductionLine saved = productionLineRepository.save(line);
        return Result.success(saved);
    }

    public Result<ProductionLine> update(Long id, ProductionLine line) {
        Optional<ProductionLine> existingOptional = productionLineRepository.findById(id);
        if (!existingOptional.isPresent()) {
            return Result.error("生产线不存在");
        }

        ProductionLine existing = existingOptional.get();
        
        if (!existing.getLineCode().equals(line.getLineCode()) 
                && productionLineRepository.existsByLineCode(line.getLineCode())) {
            return Result.error("生产线编码已存在");
        }

        line.setId(id);
        line.setCreateTime(existing.getCreateTime());
        ProductionLine updated = productionLineRepository.save(line);
        return Result.success(updated);
    }

    public Result<Void> delete(Long id) {
        if (!productionLineRepository.existsById(id)) {
            return Result.error("生产线不存在");
        }
        productionLineRepository.deleteById(id);
        return Result.success();
    }
}