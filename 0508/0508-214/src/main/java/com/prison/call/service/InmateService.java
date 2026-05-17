package com.prison.call.service;

import com.prison.call.entity.Inmate;
import com.prison.call.repository.InmateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Optional;

@Service
public class InmateService {
    
    @Autowired
    private InmateRepository inmateRepository;
    
    @Value("${system.call.monthly-quota:3}")
    private Integer defaultMonthlyQuota;
    
    @Value("${system.call.max-duration-minutes:15}")
    private Integer defaultMaxDuration;
    
    @PostConstruct
    public void initDefaultInmates() {
        if (inmateRepository.count() == 0) {
            String[][] inmateData = {
                {"P001", "张三", "男", "一监区"},
                {"P002", "李四", "男", "一监区"},
                {"P003", "王五", "男", "二监区"},
                {"P004", "赵六", "男", "二监区"},
                {"P005", "陈七", "女", "三监区"}
            };
            
            for (String[] data : inmateData) {
                Inmate inmate = new Inmate();
                inmate.setInmateNo(data[0]);
                inmate.setName(data[1]);
                inmate.setGender(data[2]);
                inmate.setPrisonArea(data[3]);
                inmate.setMonthlyQuota(defaultMonthlyQuota);
                inmate.setMaxDurationMinutes(defaultMaxDuration);
                inmateRepository.save(inmate);
            }
        }
    }
    
    public List<Inmate> getAllInmates() {
        return inmateRepository.findAll();
    }
    
    public Optional<Inmate> getInmateById(Long id) {
        return inmateRepository.findById(id);
    }
    
    public Optional<Inmate> getInmateByNo(String inmateNo) {
        return inmateRepository.findByInmateNo(inmateNo);
    }
    
    public Inmate saveInmate(Inmate inmate) {
        if (inmate.getMonthlyQuota() == null) {
            inmate.setMonthlyQuota(defaultMonthlyQuota);
        }
        if (inmate.getMaxDurationMinutes() == null) {
            inmate.setMaxDurationMinutes(defaultMaxDuration);
        }
        return inmateRepository.save(inmate);
    }
    
    public void deleteInmate(Long id) {
        inmateRepository.deleteById(id);
    }
}
