package com.autorepair.service;

import com.autorepair.entity.Customer;
import com.autorepair.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepository;
    
    public List<Customer> list() {
        return customerRepository.findAll();
    }
    
    public List<Customer> search(String keyword) {
        return customerRepository.findByNameContainingOrPhoneContaining(keyword, keyword);
    }
    
    public Customer getById(Long id) {
        Optional<Customer> optional = customerRepository.findById(id);
        return optional.orElse(null);
    }
    
    public Customer save(Customer customer) {
        return customerRepository.save(customer);
    }
    
    public void delete(Long id) {
        customerRepository.deleteById(id);
    }
}