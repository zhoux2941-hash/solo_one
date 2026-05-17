package com.lawfirm.caseManagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cases")
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "案号不能为空")
    @Column(unique = true)
    private String caseNumber;

    @NotBlank(message = "当事人不能为空")
    private String party;

    private String opposingParty;

    private String caseReason;

    @NotNull(message = "立案日期不能为空")
    private LocalDate filingDate;

    @NotNull(message = "诉讼时效截止日不能为空")
    private LocalDate statuteOfLimitationsDeadline;

    @NotBlank(message = "承办律师不能为空")
    private String lawyer;

    private String status;

    @OneToMany(mappedBy = "caseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Hearing> hearings = new ArrayList<>();

    @OneToMany(mappedBy = "caseEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Judgment> judgments = new ArrayList<>();

    @Transient
    private Long remainingDays;

    @Transient
    private String alertLevel;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaseNumber() {
        return caseNumber;
    }

    public void setCaseNumber(String caseNumber) {
        this.caseNumber = caseNumber;
    }

    public String getParty() {
        return party;
    }

    public void setParty(String party) {
        this.party = party;
    }

    public String getOpposingParty() {
        return opposingParty;
    }

    public void setOpposingParty(String opposingParty) {
        this.opposingParty = opposingParty;
    }

    public String getCaseReason() {
        return caseReason;
    }

    public void setCaseReason(String caseReason) {
        this.caseReason = caseReason;
    }

    public LocalDate getFilingDate() {
        return filingDate;
    }

    public void setFilingDate(LocalDate filingDate) {
        this.filingDate = filingDate;
    }

    public LocalDate getStatuteOfLimitationsDeadline() {
        return statuteOfLimitationsDeadline;
    }

    public void setStatuteOfLimitationsDeadline(LocalDate statuteOfLimitationsDeadline) {
        this.statuteOfLimitationsDeadline = statuteOfLimitationsDeadline;
    }

    public String getLawyer() {
        return lawyer;
    }

    public void setLawyer(String lawyer) {
        this.lawyer = lawyer;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Hearing> getHearings() {
        return hearings;
    }

    public void setHearings(List<Hearing> hearings) {
        this.hearings = hearings;
    }

    public List<Judgment> getJudgments() {
        return judgments;
    }

    public void setJudgments(List<Judgment> judgments) {
        this.judgments = judgments;
    }

    public Long getRemainingDays() {
        if (statuteOfLimitationsDeadline == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), statuteOfLimitationsDeadline);
    }

    public String getAlertLevel() {
        Long days = getRemainingDays();
        if (days == null || days < 0) {
            return "已过期";
        } else if (days <= 1) {
            return "紧急";
        } else if (days <= 7) {
            return "重要";
        } else if (days <= 30) {
            return "提醒";
        } else {
            return "正常";
        }
    }
}
