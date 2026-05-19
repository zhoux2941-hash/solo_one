package com.autorepair.service;

import com.autorepair.entity.Vehicle;
import com.autorepair.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class VehicleService {
    @Autowired
    private VehicleRepository vehicleRepository;
    
    private static final Pattern PLATE_NUMBER_PATTERN = Pattern.compile(
        "^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$"
    );
    
    public List<Vehicle> list() {
        return vehicleRepository.findAll();
    }
    
    public List<Vehicle> findByCustomerId(Long customerId) {
        return vehicleRepository.findByCustomerId(customerId);
    }
    
    public List<Vehicle> search(String keyword) {
        return vehicleRepository.findByPlateNumberContainingOrVinContaining(keyword, keyword);
    }
    
    public Vehicle getById(Long id) {
        Optional<Vehicle> optional = vehicleRepository.findById(id);
        return optional.orElse(null);
    }
    
    public Vehicle save(Vehicle vehicle) {
        if (vehicle.getPlateNumber() == null || vehicle.getPlateNumber().trim().isEmpty()) {
            throw new RuntimeException("车牌号不能为空");
        }
        if (!PLATE_NUMBER_PATTERN.matcher(vehicle.getPlateNumber()).matches()) {
            throw new RuntimeException("车牌号格式不正确，请输入正确的车牌号，如：京A12345");
        }
        return vehicleRepository.save(vehicle);
    }
    
    public void delete(Long id) {
        vehicleRepository.deleteById(id);
    }
}