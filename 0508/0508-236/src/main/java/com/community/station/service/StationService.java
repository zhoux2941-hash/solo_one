package com.community.station.service;

import com.community.station.entity.Station;
import com.community.station.repository.StationRepository;
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
public class StationService {

    @Autowired
    private StationRepository stationRepository;

    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    public Page<Station> getStationsByPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return stationRepository.findAll(pageable);
    }

    public Optional<Station> getStationById(Long id) {
        return stationRepository.findById(id);
    }

    public List<Station> searchStationsByName(String stationName) {
        return stationRepository.findByStationNameContaining(stationName);
    }

    public Page<Station> searchStationsByNameWithPage(String stationName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return stationRepository.findByStationNameContaining(stationName, pageable);
    }

    public Station createStation(Station station) {
        if (StringUtils.hasText(station.getContactPhone())) {
            if (!PhoneUtils.isValidPhone(station.getContactPhone())) {
                throw new RuntimeException("电话格式不正确，请输入11位手机号或固定电话（如：010-12345678）");
            }
            station.setContactPhone(PhoneUtils.cleanPhone(station.getContactPhone()));
        }
        return stationRepository.save(station);
    }

    public Station updateStation(Long id, Station stationDetails) {
        Station station = stationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("驿站不存在"));

        station.setStationName(stationDetails.getStationName());
        station.setAddress(stationDetails.getAddress());
        station.setServiceScope(stationDetails.getServiceScope());
        station.setBusinessHours(stationDetails.getBusinessHours());
        station.setGoverningCommunity(stationDetails.getGoverningCommunity());

        if (StringUtils.hasText(stationDetails.getContactPhone())) {
            if (!PhoneUtils.isValidPhone(stationDetails.getContactPhone())) {
                throw new RuntimeException("电话格式不正确，请输入11位手机号或固定电话（如：010-12345678）");
            }
            station.setContactPhone(PhoneUtils.cleanPhone(stationDetails.getContactPhone()));
        } else {
            station.setContactPhone(null);
        }

        station.setManager(stationDetails.getManager());
        station.setDescription(stationDetails.getDescription());

        return stationRepository.save(station);
    }

    public void deleteStation(Long id) {
        stationRepository.deleteById(id);
    }
}
