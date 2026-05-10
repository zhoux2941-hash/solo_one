package com.familytree.service;

import com.familytree.dto.PersonDTO;
import com.familytree.entity.FamilySpace;
import com.familytree.entity.Person;
import com.familytree.entity.Relationship;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.RelationshipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PersonService {
    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private RelationshipRepository relationshipRepository;

    @Autowired
    private FamilySpaceService familySpaceService;

    @Autowired
    private TreeCacheService treeCacheService;

    public List<Person> getAllPersons(Long familySpaceId) {
        familySpaceService.getFamilySpace(familySpaceId);
        return personRepository.findByFamilySpaceId(familySpaceId);
    }

    public Person getPersonById(Long familySpaceId, Long id) {
        familySpaceService.getFamilySpace(familySpaceId);
        return personRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("人员不存在"));
    }

    @Transactional
    public Person createPerson(Long familySpaceId, PersonDTO dto) {
        FamilySpace space = familySpaceService.getFamilySpace(familySpaceId);
        Person person = new Person();
        person.setName(dto.getName());
        person.setGender(dto.getGender());
        person.setBirthYear(dto.getBirthYear());
        person.setDeathYear(dto.getDeathYear());
        person.setBiography(dto.getBiography());
        person.setAvatar(dto.getAvatar());
        person.setFamilySpace(space);
        person = personRepository.save(person);

        if (dto.getFatherId() != null || dto.getMotherId() != null || dto.getSpouseId() != null) {
            Relationship rel = new Relationship();
            rel.setPerson(person);
            rel.setFamilySpace(space);
            if (dto.getFatherId() != null) {
                rel.setFather(personRepository.findById(dto.getFatherId()).orElse(null));
            }
            if (dto.getMotherId() != null) {
                rel.setMother(personRepository.findById(dto.getMotherId()).orElse(null));
            }
            if (dto.getSpouseId() != null) {
                rel.setSpouse(personRepository.findById(dto.getSpouseId()).orElse(null));
            }
            relationshipRepository.save(rel);
        }

        treeCacheService.invalidateTreeCache(familySpaceId);
        return person;
    }

    @Transactional
    public Person updatePerson(Long familySpaceId, Long id, PersonDTO dto) {
        familySpaceService.getFamilySpace(familySpaceId);
        Person person = personRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("人员不存在"));

        person.setName(dto.getName());
        person.setGender(dto.getGender());
        person.setBirthYear(dto.getBirthYear());
        person.setDeathYear(dto.getDeathYear());
        person.setBiography(dto.getBiography());
        if (dto.getAvatar() != null) {
            person.setAvatar(dto.getAvatar());
        }
        person = personRepository.save(person);

        Relationship rel = relationshipRepository.findByPerson(person).orElse(null);
        if (rel == null) {
            rel = new Relationship();
            rel.setPerson(person);
            rel.setFamilySpace(person.getFamilySpace());
        }
        if (dto.getFatherId() != null) {
            rel.setFather(personRepository.findById(dto.getFatherId()).orElse(null));
        } else {
            rel.setFather(null);
        }
        if (dto.getMotherId() != null) {
            rel.setMother(personRepository.findById(dto.getMotherId()).orElse(null));
        } else {
            rel.setMother(null);
        }
        if (dto.getSpouseId() != null) {
            rel.setSpouse(personRepository.findById(dto.getSpouseId()).orElse(null));
        } else {
            rel.setSpouse(null);
        }
        relationshipRepository.save(rel);

        treeCacheService.invalidateTreeCache(familySpaceId);
        return person;
    }

    @Transactional
    public void deletePerson(Long familySpaceId, Long id, Long newParentId) {
        familySpaceService.getFamilySpace(familySpaceId);
        Person person = personRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("人员不存在"));

        Relationship personRel = relationshipRepository.findByPerson(person).orElse(null);

        Person grandfather = personRel != null ? personRel.getFather() : null;
        Person grandmother = personRel != null ? personRel.getMother() : null;

        List<Relationship> childrenAsFather = relationshipRepository.findByFather(person);
        List<Relationship> childrenAsMother = relationshipRepository.findByMother(person);

        Person newParent = null;
        if (newParentId != null) {
            newParent = personRepository.findById(newParentId).orElse(null);
        }

        for (Relationship childRel : childrenAsFather) {
            if (newParent != null && "male".equals(newParent.getGender())) {
                childRel.setFather(newParent);
            } else if (grandfather != null) {
                childRel.setFather(grandfather);
            } else {
                childRel.setFather(null);
            }
            relationshipRepository.save(childRel);
        }

        for (Relationship childRel : childrenAsMother) {
            if (newParent != null && "female".equals(newParent.getGender())) {
                childRel.setMother(newParent);
            } else if (grandmother != null) {
                childRel.setMother(grandmother);
            } else {
                childRel.setMother(null);
            }
            relationshipRepository.save(childRel);
        }

        relationshipRepository.deleteByPerson(person);
        personRepository.delete(person);

        treeCacheService.invalidateTreeCache(familySpaceId);
    }

    public Person getPersonWithRelationship(Long familySpaceId, Long id) {
        return getPersonById(familySpaceId, id);
    }
}
