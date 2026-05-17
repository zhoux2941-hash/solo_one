package com.healthcare.service;

import com.healthcare.entity.CareRecord;
import com.healthcare.entity.CareSchedule;
import com.healthcare.repository.CareRecordRepository;
import com.healthcare.repository.CareScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class CareRecordService {
    @Autowired
    private CareRecordRepository careRecordRepository;

    @Autowired
    private CareScheduleRepository careScheduleRepository;

    public CareRecord save(CareRecord careRecord) {
        if (careRecord.getId() == null) {
            if (careRecord.getRecordNo() == null) {
                careRecord.setRecordNo(generateRecordNo());
            }
            if (careRecordRepository.existsByRecordNo(careRecord.getRecordNo())) {
                throw new RuntimeException("记录编号已存在");
            }
            if (careRecord.getScheduleId() != null) {
                Optional<CareSchedule> scheduleOpt = careScheduleRepository.findById(careRecord.getScheduleId());
                if (scheduleOpt.isPresent()) {
                    CareSchedule schedule = scheduleOpt.get();
                    schedule.setStatus("已完成");
                    careScheduleRepository.save(schedule);
                }
            }
        } else {
            if (careRecordRepository.existsByRecordNoAndIdNot(careRecord.getRecordNo(), careRecord.getId())) {
                throw new RuntimeException("记录编号已存在");
            }
        }
        return careRecordRepository.save(careRecord);
    }

    private String generateRecordNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String dateStr = LocalDateTime.now().format(formatter);
        Random random = new Random();
        int randomNum = random.nextInt(1000);
        return "CR" + dateStr + String.format("%03d", randomNum);
    }

    public void delete(Long id) {
        careRecordRepository.deleteById(id);
    }

    public CareRecord findById(Long id) {
        Optional<CareRecord> opt = careRecordRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<CareRecord> findPage(int page, int size, Long elderId, Long caregiverId, LocalDateTime startTime, LocalDateTime endTime) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "actualStartTime"));
        Specification<CareRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (elderId != null) {
                predicates.add(cb.equal(root.get("elderId"), elderId));
            }
            if (caregiverId != null) {
                predicates.add(cb.equal(root.get("caregiverId"), caregiverId));
            }
            if (startTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("actualStartTime"), startTime));
            }
            if (endTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("actualStartTime"), endTime));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return careRecordRepository.findAll(spec, pageable);
    }

    public List<CareRecord> findByElderId(Long elderId) {
        return careRecordRepository.findByElderIdOrderByActualStartTimeDesc(elderId);
    }
}
