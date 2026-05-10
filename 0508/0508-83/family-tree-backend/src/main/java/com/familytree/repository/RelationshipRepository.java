package com.familytree.repository;

import com.familytree.entity.FamilySpace;
import com.familytree.entity.Person;
import com.familytree.entity.Relationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RelationshipRepository extends JpaRepository<Relationship, Long> {
    Optional<Relationship> findByPerson(Person person);
    Optional<Relationship> findByPersonId(Long personId);
    List<Relationship> findByFamilySpace(FamilySpace familySpace);
    List<Relationship> findByFather(Person father);
    List<Relationship> findByMother(Person mother);
    void deleteByPerson(Person person);
}
