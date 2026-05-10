package com.biolab.pipette.service;

import com.biolab.pipette.dto.ExperimentDTO;
import com.biolab.pipette.dto.PipetteTaskDTO;
import com.biolab.pipette.dto.TubeRackDTO;
import com.biolab.pipette.dto.WellPositionDTO;
import com.biolab.pipette.model.Experiment;
import com.biolab.pipette.model.PipetteTask;
import com.biolab.pipette.repository.ExperimentRepository;
import com.biolab.pipette.repository.PipetteTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExperimentService {

    private final ExperimentRepository experimentRepository;
    private final PipetteTaskRepository pipetteTaskRepository;
    private final TubeRackService tubeRackService;

    private static final String SHARE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int SHARE_CODE_LENGTH = 8;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    @CacheEvict(value = {"experiments", "sharedExperiments"}, allEntries = true)
    public ExperimentDTO createExperiment(ExperimentDTO dto) {
        Experiment experiment = Experiment.builder()
                .name(dto.getName() != null ? dto.getName() : "默认实验")
                .description(dto.getDescription())
                .tubeRackId(dto.getTubeRackId())
                .createdBy(dto.getCreatedBy())
                .isShared(false)
                .build();

        Experiment savedExp = experimentRepository.save(experiment);
        List<PipetteTaskDTO> savedTasks = saveTasks(savedExp.getId(), dto.getTasks());

        return convertToDTO(savedExp, savedTasks, null);
    }

    @Cacheable(value = "experiments", key = "#id")
    public Optional<ExperimentDTO> getExperimentById(Long id) {
        return experimentRepository.findById(id)
                .map(exp -> {
                    List<PipetteTaskDTO> tasks = getTasksByExperimentId(exp.getId());
                    TubeRackDTO tubeRack = tubeRackService.getTubeRackById(exp.getTubeRackId()).orElse(null);
                    return convertToDTO(exp, tasks, tubeRack);
                });
    }

    @Cacheable(value = "experiments")
    public List<ExperimentDTO> getAllExperiments() {
        return experimentRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(exp -> {
                    List<PipetteTaskDTO> tasks = getTasksByExperimentId(exp.getId());
                    return convertToDTO(exp, tasks, null);
                })
                .collect(Collectors.toList());
    }

    @Cacheable(value = "sharedExperiments")
    public List<ExperimentDTO> getSharedExperiments() {
        return experimentRepository.findByIsSharedTrueOrderByUpdatedAtDesc().stream()
                .map(exp -> {
                    List<PipetteTaskDTO> tasks = getTasksByExperimentId(exp.getId());
                    return convertToDTO(exp, tasks, null);
                })
                .collect(Collectors.toList());
    }

    public Optional<ExperimentDTO> getExperimentByShareCode(String shareCode) {
        return experimentRepository.findByShareCode(shareCode)
                .map(exp -> {
                    List<PipetteTaskDTO> tasks = getTasksByExperimentId(exp.getId());
                    TubeRackDTO tubeRack = tubeRackService.getTubeRackById(exp.getTubeRackId()).orElse(null);
                    return convertToDTO(exp, tasks, tubeRack);
                });
    }

    @Transactional
    @CacheEvict(value = {"experiments", "sharedExperiments"}, allEntries = true)
    public Optional<ExperimentDTO> updateExperiment(Long id, ExperimentDTO dto) {
        Optional<Experiment> expOpt = experimentRepository.findById(id);
        if (expOpt.isEmpty()) {
            return Optional.empty();
        }

        Experiment experiment = expOpt.get();
        if (dto.getName() != null) {
            experiment.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            experiment.setDescription(dto.getDescription());
        }
        if (dto.getTubeRackId() != null) {
            experiment.setTubeRackId(dto.getTubeRackId());
        }

        Experiment savedExp = experimentRepository.save(experiment);

        List<PipetteTaskDTO> savedTasks = dto.getTasks() != null
                ? saveTasks(savedExp.getId(), dto.getTasks())
                : getTasksByExperimentId(savedExp.getId());

        return Optional.of(convertToDTO(savedExp, savedTasks, null));
    }

    @Transactional
    @CacheEvict(value = {"experiments", "sharedExperiments"}, allEntries = true)
    public List<PipetteTaskDTO> saveTasks(Long experimentId, List<PipetteTaskDTO> tasks) {
        pipetteTaskRepository.deleteByExperimentId(experimentId);

        if (tasks == null || tasks.isEmpty()) {
            return new ArrayList<>();
        }

        List<PipetteTask> taskEntities = new ArrayList<>();
        for (int i = 0; i < tasks.size(); i++) {
            PipetteTaskDTO dto = tasks.get(i);
            taskEntities.add(PipetteTask.builder()
                    .experimentId(experimentId)
                    .sourceWellId(dto.getSourceWellId())
                    .targetWellId(dto.getTargetWellId())
                    .volumeUl(dto.getVolumeUl())
                    .taskOrder(i + 1)
                    .notes(dto.getNotes())
                    .build());
        }

        List<PipetteTask> saved = pipetteTaskRepository.saveAll(taskEntities);
        return saved.stream()
                .map(this::convertTaskToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"experiments", "sharedExperiments"}, allEntries = true)
    public Optional<ExperimentDTO> shareExperiment(Long id) {
        Optional<Experiment> expOpt = experimentRepository.findById(id);
        if (expOpt.isEmpty()) {
            return Optional.empty();
        }

        Experiment experiment = expOpt.get();
        experiment.setIsShared(true);
        experiment.setShareCode(generateShareCode());

        Experiment saved = experimentRepository.save(experiment);
        List<PipetteTaskDTO> tasks = getTasksByExperimentId(saved.getId());
        return Optional.of(convertToDTO(saved, tasks, null));
    }

    @Transactional
    @CacheEvict(value = {"experiments", "sharedExperiments"}, allEntries = true)
    public boolean deleteExperiment(Long id) {
        if (!experimentRepository.existsById(id)) {
            return false;
        }
        pipetteTaskRepository.deleteByExperimentId(id);
        experimentRepository.deleteById(id);
        return true;
    }

    private List<PipetteTaskDTO> getTasksByExperimentId(Long experimentId) {
        List<PipetteTask> tasks = pipetteTaskRepository.findByExperimentIdOrderByTaskOrderAsc(experimentId);
        return tasks.stream().map(this::convertTaskToDTO).collect(Collectors.toList());
    }

    private String generateShareCode() {
        StringBuilder sb = new StringBuilder(SHARE_CODE_LENGTH);
        for (int i = 0; i < SHARE_CODE_LENGTH; i++) {
            sb.append(SHARE_CODE_CHARS.charAt(random.nextInt(SHARE_CODE_CHARS.length())));
        }
        return sb.toString();
    }

    private ExperimentDTO convertToDTO(Experiment exp, List<PipetteTaskDTO> tasks, TubeRackDTO tubeRack) {
        return ExperimentDTO.builder()
                .id(exp.getId())
                .name(exp.getName())
                .description(exp.getDescription())
                .tubeRackId(exp.getTubeRackId())
                .createdBy(exp.getCreatedBy())
                .isShared(exp.getIsShared())
                .shareCode(exp.getShareCode())
                .tasks(tasks)
                .tubeRack(tubeRack)
                .createdAt(exp.getCreatedAt())
                .updatedAt(exp.getUpdatedAt())
                .build();
    }

    private PipetteTaskDTO convertTaskToDTO(PipetteTask task) {
        PipetteTaskDTO dto = PipetteTaskDTO.builder()
                .id(task.getId())
                .experimentId(task.getExperimentId())
                .sourceWellId(task.getSourceWellId())
                .targetWellId(task.getTargetWellId())
                .volumeUl(task.getVolumeUl())
                .taskOrder(task.getTaskOrder())
                .notes(task.getNotes())
                .build();

        tubeRackService.getWellById(task.getSourceWellId()).ifPresent(well -> {
            dto.setSourceRow(well.getRowNum());
            dto.setSourceCol(well.getColNum());
            dto.setSourceWellLabel(well.getLabel());
        });

        tubeRackService.getWellById(task.getTargetWellId()).ifPresent(well -> {
            dto.setTargetRow(well.getRowNum());
            dto.setTargetCol(well.getColNum());
            dto.setTargetWellLabel(well.getLabel());
        });

        return dto;
    }
}