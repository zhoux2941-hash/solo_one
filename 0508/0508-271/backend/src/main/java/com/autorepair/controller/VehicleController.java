package com.autorepair.controller;

import com.autorepair.common.Result;
import com.autorepair.entity.Vehicle;
import com.autorepair.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicle")
public class VehicleController {
    @Autowired
    private VehicleService vehicleService;
    
    @GetMapping("/list")
    public Result<List<Vehicle>> list() {
        return Result.success(vehicleService.list());
    }
    
    @GetMapping("/customer/{customerId}")
    public Result<List<Vehicle>> findByCustomerId(@PathVariable Long customerId) {
        return Result.success(vehicleService.findByCustomerId(customerId));
    }
    
    @GetMapping("/search")
    public Result<List<Vehicle>> search(@RequestParam String keyword) {
        return Result.success(vehicleService.search(keyword));
    }
    
    @GetMapping("/{id}")
    public Result<Vehicle> getById(@PathVariable Long id) {
        return Result.success(vehicleService.getById(id));
    }
    
    @PostMapping("/save")
    public Result<Vehicle> save(@RequestBody Vehicle vehicle) {
        return Result.success(vehicleService.save(vehicle));
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        vehicleService.delete(id);
        return Result.success();
    }
}