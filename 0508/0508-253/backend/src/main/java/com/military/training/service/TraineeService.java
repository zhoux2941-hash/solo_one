package com.military.training.service;

import com.military.training.entity.Trainee;
import com.military.training.repository.TraineeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TraineeService {

    private static final Logger logger = LoggerFactory.getLogger(TraineeService.class);
    private static final int BATCH_SIZE = 50;

    @Autowired
    private TraineeRepository repository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<Trainee> findAll() {
        return repository.findAll();
    }

    public List<Trainee> findByPlatoon(String platoon) {
        return repository.findByPlatoon(platoon);
    }

    public List<Trainee> findBySquad(String squad) {
        return repository.findBySquad(squad);
    }

    public Optional<Trainee> findById(Long id) {
        return repository.findById(id);
    }

    public Trainee save(Trainee trainee) {
        return repository.save(trainee);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public boolean existsByEmployeeId(String employeeId) {
        return repository.existsByEmployeeId(employeeId);
    }

    @Transactional
    public Map<String, Object> batchSave(List<Trainee> trainees) {
        Map<String, Object> result = new HashMap<>();
        List<Trainee> successList = new ArrayList<>();
        List<Map<String, String>> errorList = new ArrayList<>();

        if (trainees == null || trainees.isEmpty()) {
            result.put("success", 0);
            result.put("failed", 0);
            result.put("errors", errorList);
            result.put("data", successList);
            return result;
        }

        Set<String> existingEmployeeIds = findAll().stream()
                .map(Trainee::getEmployeeId)
                .collect(Collectors.toSet());

        Set<String> batchEmployeeIds = new HashSet<>();

        for (int i = 0; i < trainees.size(); i++) {
            Trainee trainee = trainees.get(i);
            int rowNum = i + 1;

            if (trainee.getEmployeeId() == null || trainee.getEmployeeId().trim().isEmpty()) {
                addError(errorList, rowNum, "编号不能为空");
                continue;
            }

            if (trainee.getName() == null || trainee.getName().trim().isEmpty()) {
                addError(errorList, rowNum, "姓名不能为空");
                continue;
            }

            String employeeId = trainee.getEmployeeId().trim();

            if (existingEmployeeIds.contains(employeeId)) {
                addError(errorList, rowNum, "编号 " + employeeId + " 已存在");
                continue;
            }

            if (batchEmployeeIds.contains(employeeId)) {
                addError(errorList, rowNum, "编号 " + employeeId + " 在本次导入中重复");
                continue;
            }

            batchEmployeeIds.add(employeeId);
            trainee.setEmployeeId(employeeId);
            successList.add(trainee);
        }

        if (!successList.isEmpty()) {
            try {
                for (int i = 0; i < successList.size(); i++) {
                    entityManager.persist(successList.get(i));
                    if (i > 0 && i % BATCH_SIZE == 0) {
                        entityManager.flush();
                        entityManager.clear();
                        logger.info("已批量保存 {} 条记录", i);
                    }
                }
                entityManager.flush();
                entityManager.clear();
                logger.info("批量导入完成，成功 {} 条，失败 {} 条", successList.size(), errorList.size());
            } catch (Exception e) {
                logger.error("批量保存失败", e);
                throw new RuntimeException("批量保存失败: " + e.getMessage());
            }
        }

        result.put("success", successList.size());
        result.put("failed", errorList.size());
        result.put("errors", errorList);
        result.put("data", successList);
        return result;
    }

    private void addError(List<Map<String, String>> errorList, int row, String message) {
        Map<String, String> error = new HashMap<>();
        error.put("row", String.valueOf(row));
        error.put("message", message);
        errorList.add(error);
    }
}
