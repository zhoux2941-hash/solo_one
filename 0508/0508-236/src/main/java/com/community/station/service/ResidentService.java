package com.community.station.service;

import com.community.station.entity.Resident;
import com.community.station.repository.ResidentRepository;
import com.community.station.util.PhoneUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
public class ResidentService {

    @Autowired
    private ResidentRepository residentRepository;

    public List<Resident> getAllResidents() {
        return residentRepository.findAll();
    }

    public Page<Resident> getResidentsByPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return residentRepository.findAll(pageable);
    }

    public Optional<Resident> getResidentById(Long id) {
        return residentRepository.findById(id);
    }

    public Optional<Resident> getResidentByPhone(String phone) {
        return residentRepository.findByPhone(phone);
    }

    public List<Resident> getResidentsByBuilding(String buildingNumber) {
        return residentRepository.findByBuildingNumber(buildingNumber);
    }

    public Resident createResident(Resident resident) {
        if (StringUtils.hasText(resident.getPhone())) {
            if (!PhoneUtils.isValidMobile(resident.getPhone())) {
                throw new RuntimeException("手机号格式不正确，请输入11位有效手机号");
            }
            resident.setPhone(PhoneUtils.cleanPhone(resident.getPhone()));
        }
        if (StringUtils.hasText(resident.getBackupPhone())) {
            if (!PhoneUtils.isValidMobile(resident.getBackupPhone())) {
                throw new RuntimeException("备用手机号格式不正确，请输入11位有效手机号");
            }
            resident.setBackupPhone(PhoneUtils.cleanPhone(resident.getBackupPhone()));
        }
        return residentRepository.save(resident);
    }

    public Resident updateResident(Long id, Resident residentDetails) {
        Resident resident = residentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("居民不存在"));

        resident.setRealName(residentDetails.getRealName());
        
        if (StringUtils.hasText(residentDetails.getPhone())) {
            if (!PhoneUtils.isValidMobile(residentDetails.getPhone())) {
                throw new RuntimeException("手机号格式不正确，请输入11位有效手机号");
            }
            resident.setPhone(PhoneUtils.cleanPhone(residentDetails.getPhone()));
        } else {
            resident.setPhone(null);
        }
        
        if (StringUtils.hasText(residentDetails.getBackupPhone())) {
            if (!PhoneUtils.isValidMobile(residentDetails.getBackupPhone())) {
                throw new RuntimeException("备用手机号格式不正确，请输入11位有效手机号");
            }
            resident.setBackupPhone(PhoneUtils.cleanPhone(residentDetails.getBackupPhone()));
        } else {
            resident.setBackupPhone(null);
        }
        
        resident.setBuildingNumber(residentDetails.getBuildingNumber());
        resident.setRoomNumber(residentDetails.getRoomNumber());
        resident.setFullAddress(residentDetails.getFullAddress());
        resident.setPickupMethod(residentDetails.getPickupMethod());
        resident.setPickupAddress(residentDetails.getPickupAddress());
        resident.setDeliveryNotes(residentDetails.getDeliveryNotes());
        resident.setEnabled(residentDetails.getEnabled());
        resident.setRemark(residentDetails.getRemark());

        return residentRepository.save(resident);
    }

    public void deleteResident(Long id) {
        residentRepository.deleteById(id);
    }

    public Resident toggleResidentStatus(Long id) {
        Resident resident = residentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("居民不存在"));
        resident.setEnabled(!resident.getEnabled());
        return residentRepository.save(resident);
    }
}
