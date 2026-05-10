package com.familytree.repository;

import com.familytree.entity.FamilySpace;
import com.familytree.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FamilySpaceRepository extends JpaRepository<FamilySpace, Long> {
    List<FamilySpace> findByOwner(User owner);
    List<FamilySpace> findByMembersContaining(User member);
}
