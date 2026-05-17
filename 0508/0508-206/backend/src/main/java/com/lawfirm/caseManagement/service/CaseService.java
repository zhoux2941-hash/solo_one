package com.lawfirm.caseManagement.service;

import com.lawfirm.caseManagement.entity.Case;
import com.lawfirm.caseManagement.entity.Hearing;
import com.lawfirm.caseManagement.entity.Judgment;
import com.lawfirm.caseManagement.repository.CaseRepository;
import com.lawfirm.caseManagement.repository.HearingRepository;
import com.lawfirm.caseManagement.repository.JudgmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class CaseService {

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private HearingRepository hearingRepository;

    @Autowired
    private JudgmentRepository judgmentRepository;

    public List<Case> getAllCases() {
        return caseRepository.findAllByOrderByStatuteOfLimitationsDeadlineAsc();
    }

    public Optional<Case> getCaseById(Long id) {
        return caseRepository.findById(id);
    }

    @Transactional
    public Case createCase(Case caseEntity) {
        if (caseRepository.existsByCaseNumber(caseEntity.getCaseNumber())) {
            throw new RuntimeException("案号已存在");
        }
        return caseRepository.save(caseEntity);
    }

    @Transactional
    public Case updateCase(Long id, Case caseDetails) {
        Case existingCase = caseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("案件不存在"));

        existingCase.setCaseNumber(caseDetails.getCaseNumber());
        existingCase.setParty(caseDetails.getParty());
        existingCase.setOpposingParty(caseDetails.getOpposingParty());
        existingCase.setCaseReason(caseDetails.getCaseReason());
        existingCase.setFilingDate(caseDetails.getFilingDate());
        existingCase.setStatuteOfLimitationsDeadline(caseDetails.getStatuteOfLimitationsDeadline());
        existingCase.setLawyer(caseDetails.getLawyer());
        existingCase.setStatus(caseDetails.getStatus());

        return caseRepository.save(existingCase);
    }

    @Transactional
    public void deleteCase(Long id) {
        caseRepository.deleteById(id);
    }

    public List<Case> getCasesByLawyer(String lawyer) {
        return caseRepository.findByLawyer(lawyer);
    }

    public List<Case> getUpcomingDeadlineCases(int days) {
        LocalDate today = LocalDate.now();
        LocalDate deadline = today.plusDays(days);
        return caseRepository.findCasesExpiringBefore(deadline);
    }

    public List<Case> getAlertCases() {
        LocalDate today = LocalDate.now();
        LocalDate deadline30 = today.plusDays(30);
        return caseRepository.findCasesExpiringBefore(deadline30);
    }

    @Transactional
    public Hearing addHearing(Long caseId, Hearing hearing) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));
        hearing.setCaseEntity(caseEntity);
        return hearingRepository.save(hearing);
    }

    public List<Hearing> getHearingsByCaseId(Long caseId) {
        return hearingRepository.findByCaseEntityIdOrderByHearingDateDesc(caseId);
    }

    @Transactional
    public Judgment addJudgment(Long caseId, Judgment judgment) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));
        judgment.setCaseEntity(caseEntity);
        return judgmentRepository.save(judgment);
    }

    public List<Judgment> getJudgmentsByCaseId(Long caseId) {
        return judgmentRepository.findByCaseEntityIdOrderByJudgmentDateDesc(caseId);
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        List<Object[]> casesByLawyer = caseRepository.countCasesByLawyer();
        List<Map<String, Object>> lawyerStats = new ArrayList<>();

        for (Object[] row : casesByLawyer) {
            Map<String, Object> lawyerStat = new HashMap<>();
            lawyerStat.put("lawyer", row[0]);
            lawyerStat.put("caseCount", row[1]);
            lawyerStats.add(lawyerStat);
        }

        stats.put("casesByLawyer", lawyerStats);
        stats.put("totalCases", caseRepository.count());
        stats.put("alertCases", getAlertCases().size());

        return stats;
    }

    public List<Case> getCasesExpiringIn30Days() {
        LocalDate today = LocalDate.now();
        LocalDate deadline30 = today.plusDays(30);
        return caseRepository.findCasesWithUpcomingDeadline(today, deadline30);
    }

    public List<Case> getCasesExpiringIn7Days() {
        LocalDate today = LocalDate.now();
        LocalDate deadline7 = today.plusDays(7);
        return caseRepository.findCasesWithUpcomingDeadline(today, deadline7);
    }

    public List<Case> getCasesExpiringIn1Day() {
        LocalDate today = LocalDate.now();
        LocalDate deadline1 = today.plusDays(1);
        return caseRepository.findCasesWithUpcomingDeadline(today, deadline1);
    }
}
