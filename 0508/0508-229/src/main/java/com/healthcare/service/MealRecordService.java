package com.healthcare.service;

import com.healthcare.entity.MealRecord;
import com.healthcare.repository.MealRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class MealRecordService {
    @Autowired
    private MealRecordRepository mealRecordRepository;

    public MealRecord save(MealRecord mealRecord) {
        if (mealRecord.getId() == null) {
            if (mealRecord.getRecordNo() == null) {
                mealRecord.setRecordNo(generateRecordNo());
            }
            if (mealRecordRepository.existsByRecordNo(mealRecord.getRecordNo())) {
                throw new RuntimeException("用餐记录编号已存在");
            }
        } else {
            if (mealRecordRepository.existsByRecordNoAndIdNot(mealRecord.getRecordNo(), mealRecord.getId())) {
                throw new RuntimeException("用餐记录编号已存在");
            }
        }
        return mealRecordRepository.save(mealRecord);
    }

    private String generateRecordNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String dateStr = LocalDateTime.now().format(formatter);
        Random random = new Random();
        int randomNum = random.nextInt(1000);
        return "MR" + dateStr + String.format("%03d", randomNum);
    }

    public void delete(Long id) {
        mealRecordRepository.deleteById(id);
    }

    public MealRecord findById(Long id) {
        Optional<MealRecord> opt = mealRecordRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<MealRecord> findPage(int page, int size, Long elderId, LocalDate startDate, LocalDate endDate, String attendanceStatus) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "mealDate"));
        Specification<MealRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (elderId != null) {
                predicates.add(cb.equal(root.get("elderId"), elderId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("mealDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("mealDate"), endDate));
            }
            if (StringUtils.hasText(attendanceStatus)) {
                predicates.add(cb.equal(root.get("attendanceStatus"), attendanceStatus));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return mealRecordRepository.findAll(spec, pageable);
    }

    public List<MealRecord> findByElderId(Long elderId) {
        return mealRecordRepository.findByElderIdOrderByMealDateDesc(elderId);
    }

    public List<MealRecord> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return mealRecordRepository.findByMealDateBetween(startDate, endDate);
    }
}
