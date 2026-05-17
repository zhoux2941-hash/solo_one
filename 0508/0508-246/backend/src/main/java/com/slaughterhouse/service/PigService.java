package com.slaughterhouse.service;

import com.slaughterhouse.entity.Pig;
import com.slaughterhouse.repository.PigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class PigService {

    @Autowired
    private PigRepository pigRepository;

    private static final Pattern PLATE_PATTERN = Pattern.compile(
        "^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]?$"
    );
    private static final Pattern NEW_ENERGY_PATTERN = Pattern.compile(
        "^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使][A-Z][DF][A-Z0-9]{5}$"
    );

    private boolean validatePlateNumber(String plate) {
        if (plate == null || plate.trim().isEmpty()) {
            return true;
        }
        String trimmed = plate.trim().toUpperCase();
        return PLATE_PATTERN.matcher(trimmed).matches() || NEW_ENERGY_PATTERN.matcher(trimmed).matches();
    }

    public Pig registerPig(Pig pig) {
        if (!validatePlateNumber(pig.getTransportVehicle())) {
            throw new IllegalArgumentException("无效的车牌号码格式");
        }
        pig.setStatus("入场登记");
        pig.setEntryTime(LocalDateTime.now());
        if (pig.getTransportVehicle() != null) {
            pig.setTransportVehicle(pig.getTransportVehicle().trim().toUpperCase());
        }
        return pigRepository.save(pig);
    }

    public Pig quarantinePig(Long id, String result, String officer) {
        Optional<Pig> optionalPig = pigRepository.findById(id);
        if (optionalPig.isPresent()) {
            Pig pig = optionalPig.get();
            pig.setQuarantineResult(result);
            pig.setQuarantineOfficer(officer);
            pig.setQuarantineTime(LocalDateTime.now());
            if ("合格".equals(result)) {
                pig.setStatus("待宰圈");
            } else {
                pig.setStatus("不合格-待处理");
            }
            return pigRepository.save(pig);
        }
        return null;
    }

    public Pig associateCarcass(Long id, String carcassId) {
        Optional<Pig> optionalPig = pigRepository.findById(id);
        if (optionalPig.isPresent()) {
            Pig pig = optionalPig.get();
            pig.setCarcassId(carcassId);
            pig.setSlaughterTime(LocalDateTime.now());
            pig.setStatus("屠宰完成");
            return pigRepository.save(pig);
        }
        return null;
    }

    public Pig disposePig(Long id, String disposalInfo) {
        Optional<Pig> optionalPig = pigRepository.findById(id);
        if (optionalPig.isPresent()) {
            Pig pig = optionalPig.get();
            pig.setDisposalInfo(disposalInfo);
            pig.setStatus("已无害化处理");
            return pigRepository.save(pig);
        }
        return null;
    }

    public List<Pig> getAllPigs() {
        return pigRepository.findAll();
    }

    public Optional<Pig> getPigById(Long id) {
        return pigRepository.findById(id);
    }

    public Optional<Pig> getPigByRfidTag(String rfidTag) {
        return pigRepository.findByRfidTag(rfidTag);
    }

    public Optional<Pig> getPigByCarcassId(String carcassId) {
        return pigRepository.findByCarcassId(carcassId);
    }

    public List<Pig> getPigsByStatus(String status) {
        return pigRepository.findByStatus(status);
    }
}
