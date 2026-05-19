package com.autorepair.controller;

import com.autorepair.common.Result;
import com.autorepair.entity.Customer;
import com.autorepair.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {
    @Autowired
    private CustomerService customerService;
    
    @GetMapping("/list")
    public Result<List<Customer>> list() {
        return Result.success(customerService.list());
    }
    
    @GetMapping("/search")
    public Result<List<Customer>> search(@RequestParam String keyword) {
        return Result.success(customerService.search(keyword));
    }
    
    @GetMapping("/{id}")
    public Result<Customer> getById(@PathVariable Long id) {
        return Result.success(customerService.getById(id));
    }
    
    @PostMapping("/save")
    public Result<Customer> save(@RequestBody Customer customer) {
        return Result.success(customerService.save(customer));
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        customerService.delete(id);
        return Result.success();
    }
}