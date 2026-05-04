package com.medical.knowledgegraph.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import org.springframework.data.neo4j.core.schema.*;

import java.util.HashSet;
import java.util.Set;

@Node("Disease")
@JsonIgnoreProperties({"symptoms", "drugs"})
public class Disease {

    @Id
    @GeneratedValue
    private Long id;

    @Property("name")
    private String name;

    @Property("description")
    private String description;

    @Property("category")
    private String category;

    @Relationship(type = "HAS_SYMPTOM", direction = Relationship.Direction.OUTGOING)
    private Set<Symptom> symptoms = new HashSet<>();

    @Relationship(type = "TREATED_BY", direction = Relationship.Direction.OUTGOING)
    private Set<Drug> drugs = new HashSet<>();

    public Disease() {
    }

    public Disease(String name, String description, String category) {
        this.name = name;
        this.description = description;
        this.category = category;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Set<Symptom> getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(Set<Symptom> symptoms) {
        this.symptoms = symptoms;
    }

    public Set<Drug> getDrugs() {
        return drugs;
    }

    public void setDrugs(Set<Drug> drugs) {
        this.drugs = drugs;
    }

    public void addSymptom(Symptom symptom) {
        this.symptoms.add(symptom);
    }

    public void addDrug(Drug drug) {
        this.drugs.add(drug);
    }
}