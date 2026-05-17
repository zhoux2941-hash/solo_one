package com.scenic.service;

import com.scenic.entity.Position;
import com.scenic.repository.PositionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PositionService {

    @Autowired
    private PositionRepository positionRepository;

    public Map<String, Object> save(Position position) {
        Position savedPos;
        
        if (position.getId() == null) {
            // 新增岗位
            if (positionRepository.existsByPositionCode(position.getPositionCode())) {
                return Map.of("success", false, "message", "岗位编码已存在");
            }
            if (positionRepository.existsByPositionName(position.getPositionName())) {
                return Map.of("success", false, "message", "岗位名称已存在");
            }
            savedPos = positionRepository.save(position);
        } else {
            // 更新岗位
            Position existPos = positionRepository.findById(position.getId()).orElse(null);
            if (existPos == null) {
                return Map.of("success", false, "message", "岗位不存在");
            }
            
            // 检查编码是否被其他岗位占用
            Position posByCode = positionRepository.findByPositionCode(position.getPositionCode()).orElse(null);
            if (posByCode != null && !posByCode.getId().equals(position.getId())) {
                return Map.of("success", false, "message", "岗位编码已存在");
            }
            
            // 检查名称是否被其他岗位占用
            Position posByName = positionRepository.findByPositionName(position.getPositionName()).orElse(null);
            if (posByName != null && !posByName.getId().equals(position.getId())) {
                return Map.of("success", false, "message", "岗位名称已存在");
            }
            
            // 更新字段
            existPos.setPositionCode(position.getPositionCode());
            existPos.setPositionName(position.getPositionName());
            existPos.setLevel(position.getLevel());
            existPos.setPermissions(position.getPermissions());
            existPos.setStatus(position.getStatus());
            
            savedPos = positionRepository.save(existPos);
        }

        return Map.of("success", true, "message", "保存成功", "data", savedPos);
    }

    public Map<String, Object> delete(Long id) {
        if (!positionRepository.existsById(id)) {
            return Map.of("success", false, "message", "岗位不存在");
        }
        positionRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Optional<Position> findById(Long id) {
        return positionRepository.findById(id);
    }

    public List<Position> findAll() {
        return positionRepository.findAll();
    }

    public List<Position> findActive() {
        return positionRepository.findByStatus(true);
    }

    public Page<Position> findByPage(String keyword, Pageable pageable) {
        Specification<Position> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                predicates.add(cb.or(
                        cb.like(root.get("positionCode"), "%" + keyword + "%"),
                        cb.like(root.get("positionName"), "%" + keyword + "%")
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return positionRepository.findAll(spec, pageable);
    }
}
