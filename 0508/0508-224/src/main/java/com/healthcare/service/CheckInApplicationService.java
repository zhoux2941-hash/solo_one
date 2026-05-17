package com.healthcare.service;

import com.healthcare.entity.Bed;
import com.healthcare.entity.CheckInApplication;
import com.healthcare.entity.Elder;
import com.healthcare.repository.BedRepository;
import com.healthcare.repository.CheckInApplicationRepository;
import com.healthcare.repository.ElderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CheckInApplicationService {
    @Autowired
    private CheckInApplicationRepository applicationRepository;

    @Autowired
    private ElderRepository elderRepository;

    @Autowired
    private BedRepository bedRepository;

    public CheckInApplication save(CheckInApplication application) {
        if (application.getId() == null) {
            if (applicationRepository.existsByApplicationNo(application.getApplicationNo())) {
                throw new RuntimeException("申请编号已存在");
            }
        } else {
            if (applicationRepository.existsByApplicationNoAndIdNot(application.getApplicationNo(), application.getId())) {
                throw new RuntimeException("申请编号已存在");
            }
        }
        return applicationRepository.save(application);
    }

    public void delete(Long id) {
        applicationRepository.deleteById(id);
    }

    public CheckInApplication findById(Long id) {
        Optional<CheckInApplication> opt = applicationRepository.findById(id);
        return opt.orElse(null);
    }

    public Page<CheckInApplication> findPage(int page, int size, String name, String applicationStatus, Long orgId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<CheckInApplication> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(name)) {
                predicates.add(cb.like(root.get("name"), "%" + name + "%"));
            }
            if (StringUtils.hasText(applicationStatus)) {
                predicates.add(cb.equal(root.get("applicationStatus"), applicationStatus));
            }
            if (orgId != null) {
                predicates.add(cb.equal(root.get("orgId"), orgId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return applicationRepository.findAll(spec, pageable);
    }

    @Transactional
    public CheckInApplication approve(Long id, Long reviewerId, String reviewOpinion) {
        CheckInApplication application = findById(id);
        if (application == null) {
            throw new RuntimeException("申请不存在");
        }
        if (!"PENDING".equals(application.getApplicationStatus())) {
            throw new RuntimeException("当前状态不允许审核");
        }
        application.setApplicationStatus("APPROVED");
        application.setReviewerId(reviewerId);
        application.setReviewTime(LocalDateTime.now());
        application.setReviewOpinion(reviewOpinion);
        return applicationRepository.save(application);
    }

    @Transactional
    public CheckInApplication reject(Long id, Long reviewerId, String reviewOpinion) {
        CheckInApplication application = findById(id);
        if (application == null) {
            throw new RuntimeException("申请不存在");
        }
        if (!"PENDING".equals(application.getApplicationStatus())) {
            throw new RuntimeException("当前状态不允许审核");
        }
        application.setApplicationStatus("REJECTED");
        application.setReviewerId(reviewerId);
        application.setReviewTime(LocalDateTime.now());
        application.setReviewOpinion(reviewOpinion);
        return applicationRepository.save(application);
    }

    @Transactional
    public CheckInApplication assignBed(Long id, Long bedId, Long caregiverId) {
        CheckInApplication application = findById(id);
        if (application == null) {
            throw new RuntimeException("申请不存在");
        }
        if (!"APPROVED".equals(application.getApplicationStatus())) {
            throw new RuntimeException("请先通过审核");
        }

        Optional<Bed> bedOpt = bedRepository.findById(bedId);
        if (!bedOpt.isPresent()) {
            throw new RuntimeException("床位不存在");
        }
        Bed bed = bedOpt.get();
        if (!"空闲".equals(bed.getBedStatus())) {
            throw new RuntimeException("床位已被占用");
        }

        application.setAssignedBedId(bedId);
        application.setAssignedCaregiverId(caregiverId);
        return applicationRepository.save(application);
    }

    @Transactional
    public CheckInApplication completeCheckIn(Long id) {
        CheckInApplication application = findById(id);
        if (application == null) {
            throw new RuntimeException("申请不存在");
        }
        if (!"APPROVED".equals(application.getApplicationStatus())) {
            throw new RuntimeException("请先通过审核");
        }
        if (application.getAssignedBedId() == null) {
            throw new RuntimeException("请先分配床位");
        }

        Elder elder = new Elder();
        elder.setElderNo(application.getApplicationNo());
        elder.setName(application.getName());
        elder.setGender(application.getGender());
        elder.setBirthDate(application.getBirthDate());
        elder.setIdCard(application.getIdCard());
        elder.setPhone(application.getPhone());
        elder.setAddress(application.getAddress());
        elder.setOrgId(application.getOrgId());
        elder.setBedId(application.getAssignedBedId());
        elder.setCaregiverId(application.getAssignedCaregiverId());
        elder.setCheckinDate(LocalDateTime.now().toLocalDate());
        elder.setLivingStatus("在住");
        elder.setMedicalHistory(application.getMedicalHistory());
        elder.setChronicDiseases(application.getChronicDiseases());
        elder.setHealthStatus(application.getHealthStatus());
        elder.setEmergencyContactName(application.getEmergencyContactName());
        elder.setEmergencyContactPhone(application.getEmergencyContactPhone());
        elder.setEmergencyContactRelation(application.getEmergencyContactRelation());
        Elder savedElder = elderRepository.save(elder);

        Bed bed = bedRepository.findById(application.getAssignedBedId()).orElse(null);
        if (bed != null) {
            bed.setBedStatus("已入住");
            bedRepository.save(bed);
        }

        application.setElderId(savedElder.getId());
        application.setCheckinCompleted(true);
        application.setApplicationStatus("CHECKED_IN");
        return applicationRepository.save(application);
    }
}
