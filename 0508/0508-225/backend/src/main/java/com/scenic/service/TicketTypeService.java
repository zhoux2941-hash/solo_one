package com.scenic.service;

import com.scenic.entity.BusinessResource;
import com.scenic.entity.TicketType;
import com.scenic.repository.BusinessResourceRepository;
import com.scenic.repository.TicketTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TicketTypeService {

    @Autowired
    private TicketTypeRepository ticketTypeRepository;

    @Autowired
    private BusinessResourceRepository resourceRepository;

    public Map<String, Object> save(TicketType ticketType, List<Long> resourceIds) {
        TicketType savedType;

        if (resourceIds != null && !resourceIds.isEmpty()) {
            List<BusinessResource> resources = resourceRepository.findAllById(resourceIds);
            ticketType.setAvailableResources(resources);
        }

        if (ticketType.getId() == null) {
            if (ticketTypeRepository.existsByTypeCode(ticketType.getTypeCode())) {
                return Map.of("success", false, "message", "票种编码已存在");
            }
            savedType = ticketTypeRepository.save(ticketType);
        } else {
            TicketType existType = ticketTypeRepository.findById(ticketType.getId()).orElse(null);
            if (existType == null) {
                return Map.of("success", false, "message", "票种不存在");
            }

            TicketType typeByCode = ticketTypeRepository.findByTypeCode(ticketType.getTypeCode()).orElse(null);
            if (typeByCode != null && !typeByCode.getId().equals(ticketType.getId())) {
                return Map.of("success", false, "message", "票种编码已存在");
            }

            existType.setTypeCode(ticketType.getTypeCode());
            existType.setTypeName(ticketType.getTypeName());
            existType.setTicketCategory(ticketType.getTicketCategory());
            existType.setPrice(ticketType.getPrice());
            existType.setOriginalPrice(ticketType.getOriginalPrice());
            existType.setValidDays(ticketType.getValidDays());
            existType.setValidStartTime(ticketType.getValidStartTime());
            existType.setValidEndTime(ticketType.getValidEndTime());
            existType.setMaxPurchasePerPerson(ticketType.getMaxPurchasePerPerson());
            existType.setTotalInventory(ticketType.getTotalInventory());
            existType.setDescription(ticketType.getDescription());
            existType.setUseRules(ticketType.getUseRules());
            existType.setStatus(ticketType.getStatus());
            existType.setAvailableResources(ticketType.getAvailableResources());

            savedType = ticketTypeRepository.save(existType);
        }

        return Map.of("success", true, "message", "保存成功", "data", savedType);
    }

    public Map<String, Object> delete(Long id) {
        if (!ticketTypeRepository.existsById(id)) {
            return Map.of("success", false, "message", "票种不存在");
        }
        ticketTypeRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Optional<TicketType> findById(Long id) {
        return ticketTypeRepository.findById(id);
    }

    public List<TicketType> findAll() {
        return ticketTypeRepository.findAll();
    }

    public List<TicketType> findActive() {
        return ticketTypeRepository.findByStatus("启用");
    }

    public Page<TicketType> findByPage(String keyword, String ticketCategory, String status, Pageable pageable) {
        return ticketTypeRepository.findByConditions(keyword, ticketCategory, status, pageable);
    }

    public Map<String, Object> updateSoldCount(Long id, int count) {
        TicketType ticketType = ticketTypeRepository.findById(id).orElse(null);
        if (ticketType == null) {
            return Map.of("success", false, "message", "票种不存在");
        }
        ticketType.setSoldCount(ticketType.getSoldCount() + count);
        ticketTypeRepository.save(ticketType);
        return Map.of("success", true, "message", "更新成功");
    }
}
