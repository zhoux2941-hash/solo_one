package com.gym.sanitization.service;

import com.gym.sanitization.entity.Equipment;
import com.gym.sanitization.repository.EquipmentRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EquipmentService {

    private static final Logger logger = LoggerFactory.getLogger(EquipmentService.class);

    @Autowired
    private EquipmentRepository equipmentRepository;

    @PostConstruct
    public void initEquipments() {
        if (equipmentRepository.count() == 0) {
            logger.info("Initializing default gym equipments...");
            List<Equipment> equipments = new ArrayList<>();
            
            equipments.add(createEquipment("跑步机1", "商用电动跑步机", "跑步机", 2));
            equipments.add(createEquipment("跑步机2", "商用电动跑步机", "跑步机", 2));
            equipments.add(createEquipment("跑步机3", "商用电动跑步机", "跑步机", 2));
            equipments.add(createEquipment("跑步机4", "商用电动跑步机", "跑步机", 2));
            equipments.add(createEquipment("跑步机5", "商用电动跑步机", "跑步机", 2));
            
            equipments.add(createEquipment("椭圆机1", "商用椭圆训练机", "椭圆机", 3));
            equipments.add(createEquipment("椭圆机2", "商用椭圆训练机", "椭圆机", 3));
            equipments.add(createEquipment("椭圆机3", "商用椭圆训练机", "椭圆机", 3));
            
            equipments.add(createEquipment("划船机1", "水阻划船机", "划船机", 3));
            equipments.add(createEquipment("划船机2", "风阻划船机", "划船机", 3));
            
            equipments.add(createEquipment("哑铃架1", "2.5kg-25kg哑铃套装", "哑铃架", 4));
            equipments.add(createEquipment("哑铃架2", "2.5kg-25kg哑铃套装", "哑铃架", 4));
            
            equipments.add(createEquipment("动感单车1", "室内健身车", "动感单车", 3));
            equipments.add(createEquipment("动感单车2", "室内健身车", "动感单车", 3));
            
            equipments.add(createEquipment("综合训练器", "多功能力量训练器", "力量器械", 6));
            
            equipmentRepository.saveAll(equipments);
            logger.info("Successfully initialized {} gym equipments", equipments.size());
        }
    }

    private Equipment createEquipment(String name, String description, String category, Integer intervalHours) {
        Equipment equipment = new Equipment();
        equipment.setName(name);
        equipment.setDescription(description);
        equipment.setCategory(category);
        equipment.setSanitizationIntervalHours(intervalHours);
        return equipment;
    }

    public List<Equipment> getAllEquipments() {
        return equipmentRepository.findAll();
    }

    public Optional<Equipment> getEquipmentById(Long id) {
        return equipmentRepository.findById(id);
    }

    public List<Equipment> getEquipmentsByCategory(String category) {
        return equipmentRepository.findByCategory(category);
    }
}
