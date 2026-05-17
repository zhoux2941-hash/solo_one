package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.Workshop;
import com.factory.repository.WorkshopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WorkshopService {

    @Autowired
    private WorkshopRepository workshopRepository;

    public Result<Page<Workshop>> findAll(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Workshop> workshops;
        
        if (keyword != null && !keyword.isEmpty()) {
            workshops = workshopRepository.findByWorkshopNameContaining(keyword, pageable);
        } else {
            workshops = workshopRepository.findAll(pageable);
        }
        
        return Result.success(workshops);
    }

    public Result<List<Workshop>> findAllList() {
        return Result.success(workshopRepository.findAll());
    }

    public Result<Workshop> findById(Long id) {
        Optional<Workshop> workshop = workshopRepository.findById(id);
        return workshop.map(Result::success).orElseGet(() -> Result.error("车间不存在"));
    }

    public Result<Workshop> findByCode(String code) {
        Optional<Workshop> workshop = workshopRepository.findByWorkshopCode(code);
        return workshop.map(Result::success).orElseGet(() -> Result.error("车间不存在"));
    }

    public Result<Workshop> save(Workshop workshop) {
        if (workshopRepository.existsByWorkshopCode(workshop.getWorkshopCode())) {
            return Result.error("车间编码已存在");
        }
        Workshop saved = workshopRepository.save(workshop);
        return Result.success(saved);
    }

    public Result<Workshop> update(Long id, Workshop workshop) {
        Optional<Workshop> existingOptional = workshopRepository.findById(id);
        if (!existingOptional.isPresent()) {
            return Result.error("车间不存在");
        }

        Workshop existing = existingOptional.get();
        
        if (!existing.getWorkshopCode().equals(workshop.getWorkshopCode()) 
                && workshopRepository.existsByWorkshopCode(workshop.getWorkshopCode())) {
            return Result.error("车间编码已存在");
        }

        workshop.setId(id);
        workshop.setCreateTime(existing.getCreateTime());
        Workshop updated = workshopRepository.save(workshop);
        return Result.success(updated);
    }

    public Result<Void> delete(Long id) {
        if (!workshopRepository.existsById(id)) {
            return Result.error("车间不存在");
        }
        workshopRepository.deleteById(id);
        return Result.success();
    }
}