package com.museum.humidity.service;

import com.museum.humidity.entity.DeviceStatus;
import com.museum.humidity.entity.DisplayCabinet;
import com.museum.humidity.entity.ExhibitType;
import com.museum.humidity.repository.DisplayCabinetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DisplayCabinetService {
    @Autowired
    private DisplayCabinetRepository cabinetRepository;

    public List<DisplayCabinet> getAllCabinets() {
        return cabinetRepository.findAll();
    }

    public Optional<DisplayCabinet> getCabinetById(Long id) {
        return cabinetRepository.findById(id);
    }

    private void validateCabinetData(DisplayCabinet cabinet) {
        if (cabinet.getCabinetNumber() == null || cabinet.getCabinetNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("柜号不能为空！");
        }

        if (cabinet.getTargetHumidityMin() == null) {
            throw new IllegalArgumentException("湿度最小值不能为空！");
        }

        if (cabinet.getTargetHumidityMax() == null) {
            throw new IllegalArgumentException("湿度最大值不能为空！");
        }

        if (cabinet.getTargetHumidityMin() < 0 || cabinet.getTargetHumidityMin() > 100) {
            throw new IllegalArgumentException("湿度最小值必须在0-100%RH范围内！");
        }

        if (cabinet.getTargetHumidityMax() < 0 || cabinet.getTargetHumidityMax() > 100) {
            throw new IllegalArgumentException("湿度最大值必须在0-100%RH范围内！");
        }

        if (cabinet.getTargetHumidityMax() <= cabinet.getTargetHumidityMin()) {
            throw new IllegalArgumentException("湿度最大值必须大于最小值！");
        }
    }

    public DisplayCabinet createCabinet(DisplayCabinet cabinet) {
        validateCabinetData(cabinet);

        if (cabinetRepository.existsByCabinetNumber(cabinet.getCabinetNumber())) {
            throw new RuntimeException("柜号已存在: " + cabinet.getCabinetNumber());
        }
        cabinet.setStatus(DeviceStatus.NORMAL);
        return cabinetRepository.save(cabinet);
    }

    public DisplayCabinet updateCabinet(Long id, DisplayCabinet cabinetDetails) {
        validateCabinetData(cabinetDetails);

        DisplayCabinet cabinet = cabinetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("展柜不存在: " + id));

        if (!cabinet.getCabinetNumber().equals(cabinetDetails.getCabinetNumber()) &&
                cabinetRepository.existsByCabinetNumber(cabinetDetails.getCabinetNumber())) {
            throw new RuntimeException("柜号已存在: " + cabinetDetails.getCabinetNumber());
        }

        cabinet.setCabinetNumber(cabinetDetails.getCabinetNumber());
        cabinet.setExhibitType(cabinetDetails.getExhibitType());
        cabinet.setTargetHumidityMin(cabinetDetails.getTargetHumidityMin());
        cabinet.setTargetHumidityMax(cabinetDetails.getTargetHumidityMax());

        return cabinetRepository.save(cabinet);
    }

    public void deleteCabinet(Long id) {
        cabinetRepository.deleteById(id);
    }

    public void updateCurrentHumidity(Long id, Double humidity) {
        DisplayCabinet cabinet = cabinetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("展柜不存在: " + id));
        cabinet.setCurrentHumidity(humidity);
        cabinetRepository.save(cabinet);
    }

    public void updateStatus(Long id, DeviceStatus status) {
        DisplayCabinet cabinet = cabinetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("展柜不存在: " + id));
        cabinet.setStatus(status);
        cabinetRepository.save(cabinet);
    }
}
