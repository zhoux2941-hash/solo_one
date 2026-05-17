package com.lawfirm.caseManagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "judgments")
public class Judgment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "判决日期不能为空")
    private LocalDate judgmentDate;

    private String result;

    private String judgmentDetails;

    private LocalDate appealDeadline;

    private Boolean appealed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    @JsonIgnore
    private Case caseEntity;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getJudgmentDate() {
        return judgmentDate;
    }

    public void setJudgmentDate(LocalDate judgmentDate) {
        this.judgmentDate = judgmentDate;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getJudgmentDetails() {
        return judgmentDetails;
    }

    public void setJudgmentDetails(String judgmentDetails) {
        this.judgmentDetails = judgmentDetails;
    }

    public LocalDate getAppealDeadline() {
        return appealDeadline;
    }

    public void setAppealDeadline(LocalDate appealDeadline) {
        this.appealDeadline = appealDeadline;
    }

    public Boolean getAppealed() {
        return appealed;
    }

    public void setAppealed(Boolean appealed) {
        this.appealed = appealed;
    }

    public Case getCaseEntity() {
        return caseEntity;
    }

    public void setCaseEntity(Case caseEntity) {
        this.caseEntity = caseEntity;
    }
}
