package com.healthcare.service;

import com.healthcare.entity.CareItem;
import com.healthcare.entity.CareSchedule;
import com.healthcare.entity.Elder;
import com.healthcare.entity.Staff;
import com.healthcare.repository.CareItemRepository;
import com.healthcare.repository.CareScheduleRepository;
import com.healthcare.repository.ElderRepository;
import com.healthcare.repository.StaffRepository;
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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class CareScheduleService {
    @Autowired
    private CareScheduleRepository careScheduleRepository;

    @Autowired
    private ElderRepository elderRepository;

    @Autowired
    private CareItemRepository careItemRepository;

    @Autowired
    private StaffRepository staffRepository;

    public CareSchedule save(CareSchedule careSchedule) {
        if (careSchedule.getElderId() == null) {
            throw new RuntimeException("长者信息不能为空");
        }
        if (careSchedule.getCareItemId() == null) {
            throw new RuntimeException("护理项目不能为空");
        }
        if (careSchedule.getScheduleDate() == null) {
            throw new RuntimeException("排班日期不能为空");
        }

        if (careSchedule.getId() == null) {
            if (careSchedule.getScheduleNo() == null) {
                careSchedule.setScheduleNo(generateScheduleNo());
            }
            if (careScheduleRepository.existsByScheduleNo(careSchedule.getScheduleNo())) {
                throw new RuntimeException("排班编号已存在");
            }
        } else {
            if (careScheduleRepository.existsByScheduleNoAndIdNot(careSchedule.getScheduleNo(), careSchedule.getId())) {
                throw new RuntimeException("排班编号已存在");
            }
        }
        return careScheduleRepository.save(careSchedule);
    }

    private String generateScheduleNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String dateStr = LocalDate.now().format(formatter);
        Random random = new Random();
        int randomNum = random.nextInt(10000);
        return "CS" + dateStr + String.format("%04d", randomNum);
    }

    public void delete(Long id) {
        careScheduleRepository.deleteById(id);
    }

    public CareSchedule findById(Long id) {
        Optional<CareSchedule> opt = careScheduleRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<CareSchedule> findPage(int page, int size, Long elderId, Long caregiverId, LocalDate startDate, LocalDate endDate, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "scheduleDate"));
        Specification<CareSchedule> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (elderId != null) {
                predicates.add(cb.equal(root.get("elderId"), elderId));
            }
            if (caregiverId != null) {
                predicates.add(cb.equal(root.get("caregiverId"), caregiverId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("scheduleDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("scheduleDate"), endDate));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return careScheduleRepository.findAll(spec, pageable);
    }

    public List<CareSchedule> findByDate(LocalDate date) {
        return careScheduleRepository.findByScheduleDateBetween(date, date);
    }

    public List<CareSchedule> autoAssignTasks(LocalDate scheduleDate, String careLevel) {
        List<Elder> elders = elderRepository.findAll();
        List<CareItem> careItems = careItemRepository.findByStatusOrderByIdAsc(1);
        List<Staff> caregivers = staffRepository.findAll();

        List<CareSchedule> schedules = new ArrayList<>();

        for (Elder elder : elders) {
            if (!"在住".equals(elder.getLivingStatus())) {
                continue;
            }
            if (careLevel != null && !careLevel.equals(elder.getCareLevel())) {
                continue;
            }

            for (CareItem item : careItems) {
                CareSchedule schedule = new CareSchedule();
                schedule.setScheduleNo(generateScheduleNo());
                schedule.setElderId(elder.getId());
                schedule.setCareItemId(item.getId());
                schedule.setScheduleDate(scheduleDate);
                schedule.setScheduleTime(LocalTime.of(9, 0));
                schedule.setFrequency(item.getDefaultFrequency());
                schedule.setStatus("待执行");

                if (!caregivers.isEmpty()) {
                    int index = (int) (Math.random() * caregivers.size());
                    schedule.setCaregiverId(caregivers.get(index).getId());
                }

                schedules.add(careScheduleRepository.save(schedule));
            }
        }

        return schedules;
    }

    public List<CareSchedule> batchCreateSchedules(Long elderId, List<Long> careItemIds, LocalDate startDate, LocalDate endDate, Long caregiverId) {
        List<CareSchedule> schedules = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            for (Long careItemId : careItemIds) {
                CareSchedule schedule = new CareSchedule();
                schedule.setScheduleNo(generateScheduleNo());
                schedule.setElderId(elderId);
                schedule.setCareItemId(careItemId);
                schedule.setCaregiverId(caregiverId);
                schedule.setScheduleDate(current);
                schedule.setScheduleTime(LocalTime.of(9, 0));
                schedule.setStatus("待执行");
                schedules.add(careScheduleRepository.save(schedule));
            }
            current = current.plusDays(1);
        }

        return schedules;
    }
}
