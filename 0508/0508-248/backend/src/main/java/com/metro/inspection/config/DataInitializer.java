package com.metro.inspection.config;

import com.metro.inspection.dto.InspectionRecordDTO;
import com.metro.inspection.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private InspectionService inspectionService;

    @Override
    public void run(String... args) throws Exception {
        createInspection("1号线-区间A", "K12+345", "左轨", "裂纹", 3.2, "2026-05-15", null);
        createInspection("1号线-区间B", "K15+678", "右轨", "核伤", 7.5, "2026-05-16", null);
        createInspection("2号线-区间A", "K8+123", "左轨", "磨耗", 9.0, "2026-05-17", 120);
        createInspection("1号线-区间C", "K20+456", "右轨", "裂纹", 2.8, "2026-05-17", null);
        createInspection("2号线-区间B", "K10+789", "左轨", "核伤", 6.1, "2026-05-16", null);
        createInspection("1号线-区间A", "K13+500", "右轨", "磨耗", 9.2, "2026-05-14", null);
        createInspection("2号线-区间C", "K5+200", "左轨", "裂纹", 4.2, "2026-05-13", 120);
        createInspection("1号线-区间B", "K16+800", "左轨", "核伤", 5.8, "2026-05-12", null);
        
        System.out.println("测试数据初始化完成！");
        System.out.println("分级说明：");
        System.out.println("  - 1号线(80km/h): Ⅰ级<5mm, Ⅱ级5-10mm, Ⅲ级>10mm");
        System.out.println("  - 2号线(120km/h): Ⅰ级<4mm, Ⅱ级4-8mm, Ⅲ级>8mm");
        System.out.println("  - 示例：2号线9mm伤损按Ⅲ级处理（原标准为Ⅱ级）！");
    }

    private void createInspection(String section, String mileage, String railPosition, 
                                  String damageType, double depth, String date, Integer lineSpeed) {
        InspectionRecordDTO dto = new InspectionRecordDTO();
        dto.setSection(section);
        dto.setMileage(mileage);
        dto.setRailPosition(railPosition);
        dto.setDamageType(damageType);
        dto.setDepth(depth);
        dto.setInspectionDate(date);
        dto.setLineSpeed(lineSpeed);
        inspectionService.createInspection(dto);
    }
}
