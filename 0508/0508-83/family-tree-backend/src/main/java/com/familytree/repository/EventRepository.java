package com.familytree.repository;

import com.familytree.entity.Event;
import com.familytree.entity.FamilySpace;
import com.familytree.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByPerson(Person person);
    List<Event> findByPersonOrderByYearAscMonthAscDayAsc(Person person);
    List<Event> findByFamilySpaceOrderByYearAscMonthAscDayAsc(FamilySpace familySpace);
    List<Event> findByFamilySpaceIdOrderByYearAscMonthAscDayAsc(Long familySpaceId);
    void deleteByPerson(Person person);
}
