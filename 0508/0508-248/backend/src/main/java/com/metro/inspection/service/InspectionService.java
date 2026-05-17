package com.metro.inspection.service;

import com.metro.inspection.dto.InspectionRecordDTO;
import com.metro.inspection.dto.InspectionResponse;
import com.metro.inspection.entity.InspectionRecord;
import com.metro.inspection.entity.LineSpeedLevel;
import com.metro.inspection.entity.SeverityLevel;
import com.metro.inspection.entity.WorkOrder;
import com.metro.inspection.repository.InspectionRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class InspectionService {

    @Autowired
    private InspectionRecordRepository inspectionRepository;

    @Autowired
    private WorkOrderService workOrderService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional
    public InspectionResponse createInspection(InspectionRecordDTO dto) {
        InspectionRecord record = new InspectionRecord();
        record.setSection(dto.getSection());
        record.setMileage(dto.getMileage());
        record.setRailPosition(dto.getRailPosition());
        record.setDamageType(dto.getDamageType());
        record.setDepth(dto.getDepth());
        record.setInspectionDate(LocalDate.parse(dto.getInspectionDate(), DATE_FORMATTER));

        LineSpeedLevel speedLevel = determineLineSpeed(dto);
        record.setLineSpeed(speedLevel.getSpeed());

        SeverityLevel level = calculateSeverityLevel(dto.getDepth(), speedLevel);
        record.setSeverityLevel(level);

        String repairTime = calculateSuggestedRepairTime(level);
        record.setSuggestedRepairTime(repairTime);

        boolean shouldGenerateOrder = shouldGenerateWorkOrder(level);
        record.setWorkOrderGenerated(shouldGenerateOrder);

        record = inspectionRepository.save(record);

        WorkOrder workOrder = null;
        if (shouldGenerateOrder) {
            workOrder = workOrderService.createWorkOrder(record);
        }

        String message = "检测记录创建成功";
        if (workOrder != null) {
            message += "，已自动生成维修工单";
        }

        return new InspectionResponse(message, convertToVO(record), workOrder);
    }

    private LineSpeedLevel determineLineSpeed(InspectionRecordDTO dto) {
        if (dto.getLineSpeed() != null) {
            return LineSpeedLevel.fromSpeed(dto.getLineSpeed());
        }
        return LineSpeedLevel.fromSection(dto.getSection());
    }

    private SeverityLevel calculateSeverityLevel(Double depth, LineSpeedLevel speedLevel) {
        if (depth < speedLevel.getLevel1Threshold()) {
            return SeverityLevel.LEVEL1;
        } else if (depth <= speedLevel.getLevel2Threshold()) {
            return SeverityLevel.LEVEL2;
        } else {
            return SeverityLevel.LEVEL3;
        }
    }

    private String calculateSuggestedRepairTime(SeverityLevel level) {
        switch (level) {
            case LEVEL1:
                return "无特殊要求";
            case LEVEL2:
                return "1个月内";
            case LEVEL3:
                return "立即修复";
            default:
                return "";
        }
    }

    private boolean shouldGenerateWorkOrder(SeverityLevel level) {
        return level == SeverityLevel.LEVEL2 || level == SeverityLevel.LEVEL3;
    }

    public List<InspectionRecord> getAllInspections(String section, String severityLevel, String damageType) {
        SeverityLevel level = null;
        if (severityLevel != null && !severityLevel.isEmpty()) {
            if (severityLevel.equals("Ⅰ级") || severityLevel.equalsIgnoreCase("LEVEL1")) {
                level = SeverityLevel.LEVEL1;
            } else if (severityLevel.equals("Ⅱ级") || severityLevel.equalsIgnoreCase("LEVEL2")) {
                level = SeverityLevel.LEVEL2;
            } else if (severityLevel.equals("Ⅲ级") || severityLevel.equalsIgnoreCase("LEVEL3")) {
                level = SeverityLevel.LEVEL3;
            }
        }

        if (section != null && !section.isEmpty() && level != null && damageType != null && !damageType.isEmpty()) {
            return inspectionRepository.findBySectionAndSeverityLevelAndDamageType(section, level, damageType);
        } else if (section != null && !section.isEmpty() && level != null) {
            return inspectionRepository.findBySectionAndSeverityLevel(section, level);
        } else if (section != null && !section.isEmpty() && damageType != null && !damageType.isEmpty()) {
            return inspectionRepository.findBySectionAndDamageType(section, damageType);
        } else if (level != null && damageType != null && !damageType.isEmpty()) {
            return inspectionRepository.findBySeverityLevelAndDamageType(level, damageType);
        } else if (section != null && !section.isEmpty()) {
            return inspectionRepository.findBySection(section);
        } else if (level != null) {
            return inspectionRepository.findBySeverityLevel(level);
        } else if (damageType != null && !damageType.isEmpty()) {
            return inspectionRepository.findByDamageType(damageType);
        }

        return inspectionRepository.findAll();
    }

    public Optional<InspectionRecord> getInspectionById(Long id) {
        return inspectionRepository.findById(id);
    }

    @Transactional
    public boolean deleteInspection(Long id) {
        if (inspectionRepository.existsById(id)) {
            inspectionRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private Object convertToVO(InspectionRecord record) {
        return new Object() {
            public final Long id = record.getId();
            public final String section = record.getSection();
            public final String mileage = record.getMileage();
            public final String railPosition = record.getRailPosition();
            public final String damageType = record.getDamageType();
            public final Double depth = record.getDepth();
            public final Integer lineSpeed = record.getLineSpeed();
            public final String severityLevel = record.getSeverityLevel().getDescription();
            public final String inspectionDate = record.getInspectionDate().toString();
            public final String suggestedRepairTime = record.getSuggestedRepairTime();
        };
    }
}
