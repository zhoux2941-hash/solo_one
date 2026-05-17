package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.LaborWorker;
import com.construction.repository.LaborWorkerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
public class LaborWorkerService {

    @Resource
    private LaborWorkerRepository laborWorkerRepository;

    public Result<PageResult<LaborWorker>> getWorkerList(Integer pageNum, Integer pageSize, Long projectId, Long teamId, String keyword, Integer status) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Specification<LaborWorker> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (teamId != null) {
                predicates.add(criteriaBuilder.equal(root.get("teamId"), teamId));
            }

            if (StringUtils.hasText(keyword)) {
                Predicate nameLike = criteriaBuilder.like(root.get("workerName"), "%" + keyword + "%");
                Predicate idCardLike = criteriaBuilder.like(root.get("idCard"), "%" + keyword + "%");
                Predicate phoneLike = criteriaBuilder.like(root.get("phone"), "%" + keyword + "%");
                predicates.add(criteriaBuilder.or(nameLike, idCardLike, phoneLike));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<LaborWorker> page = laborWorkerRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<List<LaborWorker>> getAllActiveWorkers(Long projectId) {
        List<LaborWorker> workers;
        if (projectId != null) {
            workers = laborWorkerRepository.findByProjectIdAndStatus(projectId, 1);
        } else {
            workers = laborWorkerRepository.findAll((root, query, criteriaBuilder) -> {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(criteriaBuilder.equal(root.get("status"), 1));
                return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            }, Sort.by(Sort.Direction.DESC, "createTime"));
        }
        return Result.success(workers);
    }

    public Result<LaborWorker> getWorkerById(Long id) {
        LaborWorker worker = laborWorkerRepository.findById(id).orElse(null);
        if (worker == null) {
            return Result.error("工人不存在");
        }
        return Result.success(worker);
    }

    public Result<LaborWorker> addWorker(LaborWorker worker) {
        if (laborWorkerRepository.existsByIdCard(worker.getIdCard())) {
            return Result.error("该身份证号已存在");
        }

        worker.setId(null);
        LaborWorker saved = laborWorkerRepository.save(worker);
        return Result.success("添加成功", saved);
    }

    public Result<LaborWorker> updateWorker(Long id, LaborWorker worker) {
        LaborWorker existing = laborWorkerRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("工人不存在");
        }

        if (laborWorkerRepository.existsByIdCardAndIdNot(worker.getIdCard(), id)) {
            return Result.error("该身份证号已存在");
        }

        existing.setWorkerName(worker.getWorkerName());
        existing.setIdCard(worker.getIdCard());
        existing.setPhone(worker.getPhone());
        existing.setGender(worker.getGender());
        existing.setAge(worker.getAge());
        existing.setWorkType(worker.getWorkType());
        existing.setCertificateType(worker.getCertificateType());
        existing.setCertificateNo(worker.getCertificateNo());
        existing.setEntryDate(worker.getEntryDate());
        existing.setExitDate(worker.getExitDate());
        existing.setAddress(worker.getAddress());
        existing.setEmergencyContact(worker.getEmergencyContact());
        existing.setEmergencyPhone(worker.getEmergencyPhone());
        existing.setRemark(worker.getRemark());
        existing.setProjectId(worker.getProjectId());
        existing.setTeamId(worker.getTeamId());
        existing.setAreaId(worker.getAreaId());

        LaborWorker updated = laborWorkerRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    public Result<Void> deleteWorker(Long id) {
        if (!laborWorkerRepository.existsById(id)) {
            return Result.error("工人不存在");
        }
        laborWorkerRepository.deleteById(id);
        return Result.success("删除成功");
    }

    public Result<Void> toggleWorkerStatus(Long id) {
        LaborWorker worker = laborWorkerRepository.findById(id).orElse(null);
        if (worker == null) {
            return Result.error("工人不存在");
        }

        worker.setStatus(worker.getStatus() == 1 ? 0 : 1);
        laborWorkerRepository.save(worker);
        return Result.success(worker.getStatus() == 1 ? "工人已启用" : "工人已停用");
    }
}
