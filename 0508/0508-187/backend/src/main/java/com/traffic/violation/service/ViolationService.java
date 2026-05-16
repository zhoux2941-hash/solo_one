package com.traffic.violation.service;

import com.traffic.violation.entity.Violation;
import com.traffic.violation.repository.ViolationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ViolationService {

    private static final Pattern PLATE_NUMBER_PATTERN = Pattern.compile("^[\u4e00-\u9fa5][A-Z][A-Z0-9]{5,6}$");
    private static final int PAGE_SIZE = 10;
    private static final int DUPLICATE_CHECK_MINUTES = 5;

    @Autowired
    private ViolationRepository violationRepository;

    private void validatePlateNumber(String plateNumber) {
        if (plateNumber == null || plateNumber.trim().isEmpty()) {
            throw new RuntimeException("车牌号不能为空");
        }
        String trimmedPlate = plateNumber.trim().toUpperCase();
        if (!PLATE_NUMBER_PATTERN.matcher(trimmedPlate).matches()) {
            throw new RuntimeException("车牌号格式不正确，请输入正确的车牌号（如：粤A12345）");
        }
    }

    private void checkDuplicateViolation(String plateNumber, String location, LocalDateTime violationTime) {
        LocalDateTime startTime = violationTime.minusMinutes(DUPLICATE_CHECK_MINUTES);
        boolean exists = violationRepository.existsDuplicateViolation(plateNumber.trim().toUpperCase(), location, startTime);
        if (exists) {
            throw new RuntimeException("该车辆在" + DUPLICATE_CHECK_MINUTES + "分钟内已在同一地点录入过违章，请确认后再录入");
        }
    }

    public Violation createViolation(Violation violation) {
        validatePlateNumber(violation.getPlateNumber());
        String normalizedPlate = violation.getPlateNumber().trim().toUpperCase();
        checkDuplicateViolation(normalizedPlate, violation.getLocation(), violation.getViolationTime());
        violation.setPlateNumber(normalizedPlate);
        violation.setStatus("UNPAID");
        return violationRepository.save(violation);
    }

    public Page<Violation> getAllViolationsPaged(int page) {
        Pageable pageable = PageRequest.of(page, PAGE_SIZE);
        return violationRepository.findAllByOrderByViolationTimeDesc(pageable);
    }

    public Page<Violation> getViolationsByPlateNumberPaged(String plateNumber, int page) {
        Pageable pageable = PageRequest.of(page, PAGE_SIZE);
        return violationRepository.findByPlateNumberOrderByViolationTimeDesc(plateNumber, pageable);
    }

    public List<Violation> getViolationsByPlateNumber(String plateNumber) {
        return violationRepository.findByPlateNumberOrderByViolationTimeDesc(plateNumber);
    }

    public List<Violation> getUnpaidViolationsByPlateNumber(String plateNumber) {
        return violationRepository.findByPlateNumberAndStatusOrderByViolationTimeDesc(plateNumber, "UNPAID");
    }

    public Integer getTotalUnpaidPoints(String plateNumber) {
        return violationRepository.sumUnpaidPointsByPlateNumber(plateNumber);
    }

    public Integer getTotalPoints(String plateNumber) {
        return violationRepository.sumTotalPointsByPlateNumber(plateNumber);
    }

    public boolean isLicenseSuspended(String plateNumber) {
        Integer totalPoints = getTotalPoints(plateNumber);
        return totalPoints >= 12;
    }

    public Violation payViolation(Long id) {
        Optional<Violation> violationOpt = violationRepository.findById(id);
        if (violationOpt.isPresent()) {
            Violation violation = violationOpt.get();
            String plateNumber = violation.getPlateNumber();
            if (isLicenseSuspended(plateNumber)) {
                throw new RuntimeException("该车辆累计扣分已达12分，驾照已暂扣，禁止在线缴费，请线下处理");
            }
            violation.setStatus("PAID");
            violation.setPaymentTime(LocalDateTime.now());
            violation.setReceiptNumber(generateReceiptNumber());
            return violationRepository.save(violation);
        }
        throw new RuntimeException("违章记录不存在");
    }

    private String generateReceiptNumber() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        String uuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "EL" + timestamp + uuid;
    }

    public List<Violation> getAllViolations() {
        return violationRepository.findAll();
    }

    public Violation getViolationById(Long id) {
        return violationRepository.findById(id).orElse(null);
    }
}
