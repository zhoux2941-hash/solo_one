package com.familytree.repository;

import com.familytree.entity.FamilySpace;
import com.familytree.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    List<Person> findByFamilySpace(FamilySpace familySpace);
    List<Person> findByFamilySpaceId(Long familySpaceId);
}
