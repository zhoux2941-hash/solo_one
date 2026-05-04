package com.medical.knowledgegraph.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.neo4j.core.schema.*;

import java.util.HashSet;
import java.util.Set;

@Node("Drug")
@JsonIgnoreProperties({"diseases"})
public class Drug {

    @Id
    @GeneratedValue
    private Long id;

    @Property("name")
    private String name;

    @Property("description")
    private String description;

    @Property("category")
    private String category;

    @Property("sideEffects")
    private Set<String> sideEffects = new HashSet<>();

    @Relationship(type = "TREATS", direction = Relationship.Direction.OUTGOING)
    private Set<Disease> diseases = new HashSet<>();

    public Drug() {
    }

    public Drug(String name, String description, String category, Set<String> sideEffects) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.sideEffects = sideEffects;
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

    public Set<String> getSideEffects() {
        return sideEffects;
    }

    public void setSideEffects(Set<String> sideEffects) {
        this.sideEffects = sideEffects;
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