package com.healthcare.service;

import com.healthcare.entity.HealthRecord;
import com.healthcare.repository.HealthRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class HealthRecordService {
    @Autowired
    private HealthRecordRepository healthRecordRepository;

    public HealthRecord save(HealthRecord record) {
        if (record.getId() == null) {
            if (healthRecordRepository.existsByRecordNo(record.getRecordNo())) {
                throw new RuntimeException("档案编号已存在");
            }
        } else {
            if (healthRecordRepository.existsByRecordNoAndIdNot(record.getRecordNo(), record.getId())) {
                throw new RuntimeException("档案编号已存在");
            }
        }
        validateHealthRecord(record);
        return healthRecordRepository.save(record);
    }

    private void validateHealthRecord(HealthRecord record) {
        if (record.getHeight() != null && (record.getHeight().compareTo(new java.math.BigDecimal(0)) < 0 || record.getHeight().compareTo(new java.math.BigDecimal(300)) > 0)) {
            throw new RuntimeException("身高数值超出有效范围(0-300)");
        }
        if (record.getWeight() != null && (record.getWeight().compareTo(new java.math.BigDecimal(0)) < 0 || record.getWeight().compareTo(new java.math.BigDecimal(500)) > 0)) {
            throw new RuntimeException("体重数值超出有效范围(0-500)");
        }
        if (record.getBloodPressureSystolic() != null && (record.getBloodPressureSystolic() < 0 || record.getBloodPressureSystolic() > 300)) {
            throw new RuntimeException("收缩压数值超出有效范围(0-300)");
        }
        if (record.getBloodPressureDiastolic() != null && (record.getBloodPressureDiastolic() < 0 || record.getBloodPressureDiastolic() > 200)) {
            throw new RuntimeException("舒张压数值超出有效范围(0-200)");
        }
        if (record.getHeartRate() != null && (record.getHeartRate() < 0 || record.getHeartRate() > 300)) {
            throw new RuntimeException("心率数值超出有效范围(0-300)");
        }
        if (record.getBloodSugar() != null && (record.getBloodSugar().compareTo(new java.math.BigDecimal(0)) < 0 || record.getBloodSugar().compareTo(new java.math.BigDecimal(50)) > 0)) {
            throw new RuntimeException("血糖数值超出有效范围(0-50)");
        }
        if (record.getAdlScore() != null && (record.getAdlScore() < 0 || record.getAdlScore() > 100)) {
            throw new RuntimeException("ADL评分数值超出有效范围(0-100)");
        }
        if (record.getBloodPressureSystolic() != null && record.getBloodPressureDiastolic() != null && record.getBloodPressureSystolic() <= record.getBloodPressureDiastolic()) {
            throw new RuntimeException("收缩压必须大于舒张压");
        }
    }

    public void delete(Long id) {
        healthRecordRepository.deleteById(id);
    }

    public HealthRecord findById(Long id) {
        Optional<HealthRecord> opt = healthRecordRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<HealthRecord> findPage(int page, int size, Long elderId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "recordDate"));
        Specification<HealthRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (elderId != null) {
                predicates.add(cb.equal(root.get("elderId"), elderId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return healthRecordRepository.findAll(spec, pageable);
    }

    public List<HealthRecord> findByElderId(Long elderId) {
        return healthRecordRepository.findByElderIdOrderByRecordDateDesc(elderId);
    }
}
