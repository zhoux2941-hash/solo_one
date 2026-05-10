package com.familytree.service;

import com.familytree.entity.FamilySpace;
import com.familytree.entity.Person;
import com.familytree.entity.Relationship;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.RelationshipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GedcomService {
    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private RelationshipRepository relationshipRepository;

    @Autowired
    private TreeCacheService treeCacheService;

    @Transactional
    public void importGedcom(Long familySpaceId, String gedcomContent, FamilySpace space) throws IOException {
        Map<String, Person> individualMap = new HashMap<>();
        Map<String, String> familyMap = new HashMap<>();
        BufferedReader reader = new BufferedReader(new StringReader(gedcomContent));
        
        String line;
        String currentType = null;
        String currentId = null;
        String currentName = null;
        String currentSex = null;
        Integer currentBirthYear = null;
        Integer currentDeathYear = null;
        String husbandId = null;
        String wifeId = null;
        
        while ((line = reader.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            
            String[] parts = line.split(" ", 3);
            int level = Integer.parseInt(parts[0]);
            
            if (level == 0) {
                if (currentType != null && currentType.equals("INDI")) {
                    Person person = createOrUpdatePerson(individualMap, currentId, currentName, currentSex, 
                        currentBirthYear, currentDeathYear, space);
                    individualMap.put(currentId, person);
                }
                
                if (parts.length >= 2 && parts[1].startsWith("@") && parts[1].endsWith("@")) {
                    currentId = parts[1].substring(1, parts[1].length() - 1);
                    currentType = parts.length >= 3 ? parts[2] : null;
                    currentName = null;
                    currentSex = null;
                    currentBirthYear = null;
                    currentDeathYear = null;
                    husbandId = null;
                    wifeId = null;
                }
            } else if (level == 1) {
                if ("NAME".equals(parts[1]) && parts.length >= 3) {
                    currentName = parts[2].replace("/", "").trim();
                } else if ("SEX".equals(parts[1]) && parts.length >= 3) {
                    currentSex = "M".equals(parts[2]) ? "male" : "female";
                } else if ("BIRT".equals(parts[1])) {
                } else if ("DEAT".equals(parts[1])) {
                } else if ("FAMC".equals(parts[1]) && parts.length >= 3) {
                    String famId = parts[2].replace("@", "");
                    familyMap.put(currentId + "_CHILD", famId);
                } else if ("HUSB".equals(parts[1]) && parts.length >= 3) {
                    husbandId = parts[2].replace("@", "");
                } else if ("WIFE".equals(parts[1]) && parts.length >= 3) {
                    wifeId = parts[2].replace("@", "");
                }
            } else if (level == 2) {
                if ("DATE".equals(parts[1]) && parts.length >= 3) {
                    String dateStr = parts[2];
                    Integer year = extractYear(dateStr);
                    if (currentType != null) {
                        if (line.contains("BIRT") || "BIRT".equals(currentType.substring(0, Math.min(4, currentType.length())))) {
                            currentBirthYear = year;
                        } else if (line.contains("DEAT") || "DEAT".equals(currentType.substring(0, Math.min(4, currentType.length())))) {
                            currentDeathYear = year;
                        }
                    }
                }
            }
        }
        
        if (currentType != null && currentType.equals("INDI")) {
            Person person = createOrUpdatePerson(individualMap, currentId, currentName, currentSex, 
                currentBirthYear, currentDeathYear, space);
            individualMap.put(currentId, person);
        }
        
        treeCacheService.invalidateTreeCache(familySpaceId);
    }

    private Person createOrUpdatePerson(Map<String, Person> individualMap, String gedcomId, 
                                        String name, String sex, Integer birthYear, Integer deathYear, FamilySpace space) {
        if (name == null) name = "Unknown";
        if (sex == null) sex = "male";
        
        Person person = new Person();
        person.setName(name);
        person.setGender(sex);
        person.setBirthYear(birthYear);
        person.setDeathYear(deathYear);
        person.setFamilySpace(space);
        person.setCreatedAt(LocalDateTime.now());
        person.setUpdatedAt(LocalDateTime.now());
        return personRepository.save(person);
    }

    private Integer extractYear(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        try {
            String[] parts = dateStr.split(" ");
            for (String part : parts) {
                if (part.matches("\\d{4}")) {
                    return Integer.parseInt(part);
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    public String exportGedcom(Long familySpaceId, FamilySpace space) {
        StringWriter writer = new StringWriter();
        
        writer.write("0 HEAD\n");
        writer.write("1 GEDC\n");
        writer.write("2 VERS 5.5.5\n");
        writer.write("2 FORM LINEAGE-LINKED\n");
        writer.write("1 CHAR UTF-8\n");
        writer.write("1 SOUR FAMILY-TREE-APP\n");
        writer.write("2 NAME Family Tree Editor\n");
        
        List<Person> persons = personRepository.findByFamilySpaceId(familySpaceId);
        Map<Long, String> personToGedcomId = new HashMap<>();
        
        int indiCount = 1;
        for (Person p : persons) {
            String gedcomId = "I" + indiCount++;
            personToGedcomId.put(p.getId(), gedcomId);
            
            writer.write("0 @" + gedcomId + "@ INDI\n");
            writer.write("1 NAME " + p.getName() + "\n");
            writer.write("1 SEX " + ("male".equals(p.getGender()) ? "M" : "F") + "\n");
            if (p.getBirthYear() != null) {
                writer.write("1 BIRT\n");
                writer.write("2 DATE " + p.getBirthYear() + "\n");
            }
            if (p.getDeathYear() != null) {
                writer.write("1 DEAT\n");
                writer.write("2 DATE " + p.getDeathYear() + "\n");
            }
            if (p.getBiography() != null && !p.getBiography().isEmpty()) {
                writer.write("1 NOTE " + p.getBiography() + "\n");
            }
        }
        
        int famCount = 1;
        for (Person p : persons) {
            Relationship rel = relationshipRepository.findByPerson(p).orElse(null);
            if (rel != null && (rel.getFather() != null || rel.getMother() != null)) {
                String famId = "F" + famCount++;
                writer.write("0 @" + famId + "@ FAM\n");
                if (rel.getFather() != null) {
                    writer.write("1 HUSB @" + personToGedcomId.get(rel.getFather().getId()) + "@\n");
                }
                if (rel.getMother() != null) {
                    writer.write("1 WIFE @" + personToGedcomId.get(rel.getMother().getId()) + "@\n");
                }
                writer.write("1 CHIL @" + personToGedcomId.get(p.getId()) + "@\n");
            }
        }
        
        writer.write("0 TRLR\n");
        
        treeCacheService.invalidateTreeCache(familySpaceId);
        return writer.toString();
    }
}
