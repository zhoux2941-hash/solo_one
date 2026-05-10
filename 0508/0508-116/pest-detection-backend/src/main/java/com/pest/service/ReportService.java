package com.pest.service;

import com.pest.dto.DiagnosisRequest;
import com.pest.dto.ReportRequest;
import com.pest.entity.Report;
import com.pest.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class ReportService {

    private static final String RECENT_REPORTS_KEY = "recent:reports";
    private static final int MAX_IMAGES = 3;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private FileStorageService fileStorageService;

    @Transactional
    public Report createReport(ReportRequest request, List<MultipartFile> images) throws IOException {
        if (images != null && images.size() > MAX_IMAGES) {
            throw new RuntimeException("最多上传" + MAX_IMAGES + "张图片");
        }

        Report report = new Report();
        report.setFarmerId(request.getFarmerId());
        report.setCropType(request.getCropType());
        report.setDescription(request.getDescription());
        report.setArea(request.getArea());
        report.setStatus(Report.Status.PENDING);

        List<String> imagePaths = new ArrayList<>();
        if (images != null) {
            for (MultipartFile file : images) {
                if (!file.isEmpty()) {
                    String path = fileStorageService.saveFile(file);
                    imagePaths.add(path);
                }
            }
        }
        report.setImages(imagePaths);

        Report saved = reportRepository.save(report);
        updateRecentReportsCache();

        return saved;
    }

    @Transactional
    public Report diagnose(Long reportId, DiagnosisRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("上报记录不存在"));

        if (report.getStatus() != Report.Status.PENDING) {
            throw new RuntimeException("该上报已被诊断");
        }

        report.setExpertId(request.getExpertId());
        report.setDiagnosisText(request.getDiagnosisText());
        report.setPestName(request.getPestName());
        report.setMedicineSuggestion(request.getMedicineSuggestion());
        report.setSeverity(Report.Severity.valueOf(request.getSeverity().toUpperCase()));
        report.setStatus(Report.Status.DIAGNOSED);
        report.setDiagnosisTime(LocalDateTime.now());

        return reportRepository.save(report);
    }

    @Transactional
    public Report evaluate(Long reportId, String evaluation) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("上报记录不存在"));

        if (report.getStatus() != Report.Status.DIAGNOSED) {
            throw new RuntimeException("该上报尚未诊断或已评价");
        }

        report.setEvaluation(Report.Evaluation.valueOf(evaluation.toUpperCase()));
        report.setStatus(Report.Status.EVALUATED);
        report.setEvaluationTime(LocalDateTime.now());

        return reportRepository.save(report);
    }

    public List<Report> getByFarmer(Long farmerId) {
        return reportRepository.findByFarmerIdOrderByReportTimeDesc(farmerId);
    }

    public List<Report> getPending() {
        return reportRepository.findByStatusOrderByReportTimeDesc(Report.Status.PENDING);
    }

    public Report getById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("上报记录不存在"));
    }

    @SuppressWarnings("unchecked")
    public List<Report> getRecentReports() {
        List<Report> cached = (List<Report>) redisTemplate.opsForValue().get(RECENT_REPORTS_KEY);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

        List<Report> reports = reportRepository.findTop10ByOrderByReportTimeDesc();
        redisTemplate.opsForValue().set(RECENT_REPORTS_KEY, reports, 5, TimeUnit.MINUTES);
        return reports;
    }

    private void updateRecentReportsCache() {
        List<Report> reports = reportRepository.findTop10ByOrderByReportTimeDesc();
        redisTemplate.opsForValue().set(RECENT_REPORTS_KEY, reports, 5, TimeUnit.MINUTES);
    }

    public List<Object[]> getCropTypeStats() {
        return reportRepository.countByCropType();
    }

    public List<Object[]> getPestNameStats() {
        return reportRepository.countByPestName();
    }
}