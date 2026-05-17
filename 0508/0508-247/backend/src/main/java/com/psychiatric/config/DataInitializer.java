package com.psychiatric.config;

import com.psychiatric.entity.Patient;
import com.psychiatric.entity.Ward;
import com.psychiatric.repository.PatientRepository;
import com.psychiatric.repository.WardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private WardRepository wardRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Override
    public void run(String... args) {
        if (wardRepository.count() == 0) {
            Ward ward1 = new Ward();
            ward1.setWardNumber("A101");
            ward1.setDoorLocked(true);
            ward1.setAuthorizedPersonnel(Arrays.asList("张护士", "李医生"));
            wardRepository.save(ward1);
            
            Ward ward2 = new Ward();
            ward2.setWardNumber("A102");
            ward2.setDoorLocked(true);
            ward2.setAuthorizedPersonnel(Arrays.asList("王护士", "赵医生"));
            wardRepository.save(ward2);
            
            Ward ward3 = new Ward();
            ward3.setWardNumber("A103");
            ward3.setDoorLocked(true);
            ward3.setAuthorizedPersonnel(Arrays.asList("刘护士", "陈医生"));
            wardRepository.save(ward3);
        }
        
        if (patientRepository.count() == 0) {
            Patient patient1 = new Patient();
            patient1.setBraceletId("B001");
            patient1.setName("张三");
            patient1.setWardNumber("A101");
            patient1.setCurrentLocation("病房内");
            patientRepository.save(patient1);
            
            Patient patient2 = new Patient();
            patient2.setBraceletId("B002");
            patient2.setName("李四");
            patient2.setWardNumber("A101");
            patient2.setCurrentLocation("病房内");
            patientRepository.save(patient2);
            
            Patient patient3 = new Patient();
            patient3.setBraceletId("B003");
            patient3.setName("王五");
            patient3.setWardNumber("A102");
            patient3.setCurrentLocation("活动室");
            patientRepository.save(patient3);
            
            Patient patient4 = new Patient();
            patient4.setBraceletId("B004");
            patient4.setName("赵六");
            patient4.setWardNumber("A103");
            patient4.setCurrentLocation("病房内");
            patientRepository.save(patient4);
        }
    }
}
