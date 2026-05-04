package com.medical.knowledgegraph.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.neo4j.core.schema.*;

import java.util.HashSet;
import java.util.Set;

@Node("Symptom")
@JsonIgnoreProperties({"diseases"})
public class Symptom {

    @Id
    @GeneratedValue
    private Long id;

    @Property("name")
    private String name;

    @Property("description")
    private String description;

    @Property("severity")
    private String severity;

    @Relationship(type = "INDICATES", direction = Relationship.Direction.OUTGOING)
    private Set<Disease> diseases = new HashSet<>();

    public Symptom() {
    }

    public Symptom(String name, String description, String severity) {
        this.name = name;
        this.description = description;
        this.severity = severity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Set<Disease> getDiseases() {
        return diseases;
    }

    public void setDiseases(Set<Disease> diseases) {
        this.diseases = diseases;
    }

    public void addDisease(Disease disease) {
        this.diseases.add(disease);
    }
}