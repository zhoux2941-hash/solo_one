package com.campsite.service;

import com.campsite.entity.CampRecord;
import com.campsite.repository.CampRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CampRecordService {

    @Autowired
    private CampRecordRepository campRecordRepository;

    public List<CampRecord> findAll() {
        return campRecordRepository.findAll();
    }

    public Page<CampRecord> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return campRecordRepository.findAll(pageable);
    }

    public Optional<CampRecord> findById(Long id) {
        return campRecordRepository.findById(id);
    }

    public List<CampRecord> findByStatus(String status) {
        return campRecordRepository.findByStatus(status);
    }

    public Page<CampRecord> findByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return campRecordRepository.findByStatus(status, pageable);
    }

    public List<CampRecord> findByCampAreaId(Long campAreaId) {
        return campRecordRepository.findByCampAreaId(campAreaId);
    }

    public CampRecord save(CampRecord campRecord) {
        return campRecordRepository.save(campRecord);
    }

    public void deleteById(Long id) {
        campRecordRepository.deleteById(id);
    }

    public CampRecord update(Long id, CampRecord campRecord) {
        Optional<CampRecord> existingOpt = campRecordRepository.findById(id);
        if (existingOpt.isPresent()) {
            CampRecord existing = existingOpt.get();
            existing.setTeamName(campRecord.getTeamName());
            existing.setTeamLeader(campRecord.getTeamLeader());
            existing.setLeaderIdCard(campRecord.getLeaderIdCard());
            existing.setLeaderPhone(campRecord.getLeaderPhone());
            existing.setPeopleCount(campRecord.getPeopleCount());
            existing.setCampAreaId(campRecord.getCampAreaId());
            existing.setCheckInTime(campRecord.getCheckInTime());
            existing.setCheckOutTime(campRecord.getCheckOutTime());
            existing.setStatus(campRecord.getStatus());
            existing.setNotes(campRecord.getNotes());
            return campRecordRepository.save(existing);
        }
        return null;
    }
}
