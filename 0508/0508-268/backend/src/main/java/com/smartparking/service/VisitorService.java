package com.smartparking.service;

import com.smartparking.entity.Visitor;
import com.smartparking.exception.BusinessException;
import com.smartparking.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitorService {

    private final VisitorRepository visitorRepository;
    private final ParkingService parkingService;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<Visitor> findVisitors(String name, String phone, String plateNumber, String status, int page, int size) {
        return visitorRepository.findByConditions(name, phone, plateNumber, status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime")));
    }

    public List<Visitor> findTodayVisitors() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        return visitorRepository.findByEntryTimeBetween(startOfDay, LocalDateTime.now());
    }

    public Visitor findById(Long id) {
        return visitorRepository.findById(id)
                .orElseThrow(() -> new BusinessException("访客记录不存在"));
    }

    @Transactional
    public Visitor createVisitor(Visitor visitor) {
        if (visitor.getName() == null || visitor.getPhone() == null) {
            throw new BusinessException("姓名和手机号不能为空");
        }

        if (visitor.getEntryTime() == null) {
            visitor.setEntryTime(LocalDateTime.now());
        }

        if (visitor.getDurationHours() != null && visitor.getExpireTime() == null) {
            visitor.setExpireTime(visitor.getEntryTime().plusHours(visitor.getDurationHours()));
        }

        visitor.setStatus("ACTIVE");
        Visitor saved = visitorRepository.save(visitor);
        log.info("访客登记成功: {}, {}", saved.getName(), saved.getPlateNumber());

        if (saved.getPlateNumber() != null && !saved.getPlateNumber().isEmpty()) {
            try {
                parkingService.vehicleEntry(visitor.getParkingLotId() != null ? visitor.getParkingLotId() : 1L,
                        null, saved.getPlateNumber());
            } catch (Exception e) {
                log.warn("自动入场登记失败: {}", e.getMessage());
            }
        }

        return saved;
    }

    @Transactional
    public Visitor updateVisitor(Long id, Visitor visitor) {
        Visitor existing = findById(id);
        existing.setName(visitor.getName());
        existing.setPhone(visitor.getPhone());
        existing.setPlateNumber(visitor.getPlateNumber());
        existing.setDurationHours(visitor.getDurationHours());
        existing.setReason(visitor.getReason());
        existing.setHost(visitor.getHost());
        existing.setRemark(visitor.getRemark());
        return visitorRepository.save(existing);
    }

    @Transactional
    public void checkOutVisitor(Long id) {
        Visitor visitor = findById(id);
        visitor.setExitTime(LocalDateTime.now());
        visitor.setStatus("EXPIRED");
        visitorRepository.save(visitor);
        log.info("访客离场: {}", visitor.getName());
    }

    @Transactional
    public void deleteVisitor(Long id) {
        visitorRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> batchImport(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".csv") && !filename.endsWith(".txt"))) {
            throw new BusinessException("请上传CSV或TXT文件");
        }

        List<Visitor> successList = new ArrayList<>();
        List<Map<String, String>> errorList = new ArrayList<>();
        int totalCount = 0;
        int successCount = 0;
        int errorCount = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                totalCount++;

                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }

                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    String[] fields = line.split(",");
                    if (fields.length < 2) {
                        throw new BusinessException("数据格式不正确");
                    }

                    Visitor visitor = new Visitor();
                    visitor.setName(fields[0].trim());
                    visitor.setPhone(fields[1].trim());
                    visitor.setPlateNumber(fields.length > 2 ? fields[2].trim() : null);
                    visitor.setDurationHours(fields.length > 3 ? Integer.parseInt(fields[3].trim()) : 2);
                    visitor.setReason(fields.length > 4 ? fields[4].trim() : "临时访问");
                    visitor.setHost(fields.length > 5 ? fields[5].trim() : null);
                    visitor.setVisitorType(fields.length > 6 ? fields[6].trim() : "NORMAL");
                    visitor.setIdCard(fields.length > 7 ? fields[7].trim() : null);

                    Visitor saved = createVisitor(visitor);
                    successList.add(saved);
                    successCount++;

                } catch (Exception e) {
                    errorCount++;
                    Map<String, String> error = new HashMap<>();
                    error.put("line", line);
                    error.put("message", e.getMessage());
                    error.put("rowNum", String.valueOf(totalCount));
                    errorList.add(error);
                    log.warn("第{}行导入失败: {}", totalCount, e.getMessage());
                }
            }

        } catch (Exception e) {
            throw new BusinessException("文件解析失败: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", totalCount - 1);
        result.put("successCount", successCount);
        result.put("errorCount", errorCount);
        result.put("successList", successList);
        result.put("errorList", errorList);

        log.info("批量导入完成, 总计: {}, 成功: {}, 失败: {}", totalCount - 1, successCount, errorCount);
        return result;
    }

    public List<Visitor> exportVisitors(String name, String phone, String plateNumber, String status) {
        Page<Visitor> page = findVisitors(name, phone, plateNumber, status, 0, 10000);
        return page.getContent();
    }

    public String generateCsvTemplate() {
        StringBuilder sb = new StringBuilder();
        sb.append("姓名,手机号,车牌号,访问时长(小时),访问事由,被访人,访客类型,身份证号\n");
        sb.append("张三,13800138000,京A12345,2,探亲访友,李四,NORMAL,110101199001011234\n");
        sb.append("王五,13900139000,沪B67890,4,商务洽谈,赵六,VIP,\n");
        return sb.toString();
    }

    public Map<String, Long> getStatistics() {
        Map<String, Long> stats = new HashMap<>();
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        stats.put("todayVisitors", visitorRepository.countTodayVisitors(startOfDay));
        stats.put("activeVisitors", visitorRepository.countActiveVisitors());
        stats.put("totalVisitors", visitorRepository.count());
        return stats;
    }
}
