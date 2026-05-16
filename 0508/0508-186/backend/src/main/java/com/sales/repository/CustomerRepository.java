package com.sales.repository;

import com.sales.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findBySalesperson(String salesperson);

    List<Customer> findByLevel(Customer.CustomerLevel level);

    @Query("SELECT DISTINCT c.salesperson FROM Customer c WHERE c.salesperson IS NOT NULL")
    List<String> findAllSalespersons();
}