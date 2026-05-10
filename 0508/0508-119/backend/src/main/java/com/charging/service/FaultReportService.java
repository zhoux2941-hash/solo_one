package com.charging.service;

import com.charging.dto.FaultReportRequest;
import com.charging.entity.ChargingPile;
import com.charging.entity.FaultReport;
import com.charging.entity.FaultReportStatus;
import com.charging.entity.PileStatus;
import com.charging.repository.FaultReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaultReportService {
    
    private final FaultReportRepository faultReportRepository;
    private final ChargingPileService chargingPileService;
    
    @Transactional
    public FaultReport createReport(Long reporterId, FaultReportRequest request) {
        Long pileId = request.getPileId();
        
        if (pileId == null && request.getPileCode() != null) {
            Optional<ChargingPile> pileOpt = chargingPileService.getPileByCode(request.getPileCode());
            if (pileOpt.isEmpty()) {
                throw new RuntimeException("充电桩不存在");
            }
            pileId = pileOpt.get().getId();
        }
        
        if (pileId == null) {
            throw new RuntimeException("请提供充电桩编号或ID");
        }
        
        ChargingPile pile = chargingPileService.getPileById(pileId)
                .orElseThrow(() -> new RuntimeException("充电桩不存在"));
        
        List<FaultReport> pendingReports = faultReportRepository
                .findByPileIdAndStatus(pileId, FaultReportStatus.PENDING);
        if (!pendingReports.isEmpty()) {
            throw new RuntimeException("该充电桩已有待处理的故障报告");
        }
        
        FaultReport report = new FaultReport();
        report.setPileId(pileId);
        report.setReporterId(reporterId);
        report.setDescription(request.getDescription());
        report.setPhotoUrl(request.getPhotoUrl());
        report.setStatus(FaultReportStatus.PENDING);
        report.setReportedAt(LocalDateTime.now());
        
        FaultReport saved = faultReportRepository.save(report);
        
        chargingPileService.updatePileStatus(pileId, PileStatus.MAINTENANCE);
        
        log.info("Fault report created: pileId={}, reporterId={}", pileId, reporterId);
        
        return saved;
    }
    
    public List<FaultReport> getAllReports() {
        return faultReportRepository.findAll();
    }
    
    public List<FaultReport> getReportsByStatus(FaultReportStatus status) {
        return faultReportRepository.findByStatus(status);
    }
    
    public List<FaultReport> getMyReports(Long reporterId) {
        return faultReportRepository.findByReporterId(reporterId);
    }
    
    public List<FaultReport> getPileReports(Long pileId) {
        return faultReportRepository.findByPileId(pileId);
    }
    
    public Optional<FaultReport> getReportById(Long id) {
        return faultReportRepository.findById(id);
    }
    
    @Transactional
    public FaultReport processReport(Long reportId, Long handlerId) {
        FaultReport report = faultReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("故障报告不存在"));
        
        if (report.getStatus() != FaultReportStatus.PENDING) {
            throw new RuntimeException("故障报告状态不正确");
        }
        
        report.setStatus(FaultReportStatus.PROCESSING);
        report.setHandlerId(handlerId);
        
        return faultReportRepository.save(report);
    }
    
    @Transactional
    public FaultReport resolveReport(Long reportId, Long handlerId, String handleNote) {
        FaultReport report = faultReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("故障报告不存在"));
        
        if (report.getStatus() != FaultReportStatus.PENDING && 
            report.getStatus() != FaultReportStatus.PROCESSING) {
            throw new RuntimeException("故障报告状态不正确");
        }
        
        report.setStatus(FaultReportStatus.RESOLVED);
        report.setHandlerId(handlerId);
        report.setHandleNote(handleNote);
        report.setHandledAt(LocalDateTime.now());
        
        FaultReport saved = faultReportRepository.save(report);
        
        chargingPileService.updatePileStatus(report.getPileId(), PileStatus.AVAILABLE);
        
        log.info("Fault report resolved: reportId={}, pileId={}", reportId, report.getPileId());
        
        return saved;
    }
    
    @Transactional
    public FaultReport rejectReport(Long reportId, Long handlerId, String handleNote) {
        FaultReport report = faultReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("故障报告不存在"));
        
        if (report.getStatus() != FaultReportStatus.PENDING && 
            report.getStatus() != FaultReportStatus.PROCESSING) {
            throw new RuntimeException("故障报告状态不正确");
        }
        
        report.setStatus(FaultReportStatus.REJECTED);
        report.setHandlerId(handlerId);
        report.setHandleNote(handleNote);
        report.setHandledAt(LocalDateTime.now());
        
        FaultReport saved = faultReportRepository.save(report);
        
        chargingPileService.updatePileStatus(report.getPileId(), PileStatus.AVAILABLE);
        
        log.info("Fault report rejected: reportId={}, pileId={}", reportId, report.getPileId());
        
        return saved;
    }
}
