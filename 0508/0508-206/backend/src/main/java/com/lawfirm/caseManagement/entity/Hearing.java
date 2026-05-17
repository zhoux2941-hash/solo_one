package com.lawfirm.caseManagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "hearings")
public class Hearing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "开庭日期不能为空")
    private LocalDate hearingDate;

    private String court;

    private String judge;

    private String notes;

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

    public LocalDate getHearingDate() {
        return hearingDate;
    }

    public void setHearingDate(LocalDate hearingDate) {
        this.hearingDate = hearingDate;
    }

    public String getCourt() {
        return court;
    }

    public void setCourt(String court) {
        this.court = court;
    }

    public String getJudge() {
        return judge;
    }

    public void setJudge(String judge) {
        this.judge = judge;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Case getCaseEntity() {
        return caseEntity;
    }

    public void setCaseEntity(Case caseEntity) {
        this.caseEntity = caseEntity;
    }
}
