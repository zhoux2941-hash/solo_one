package com.pet.hospital.service;

import com.pet.hospital.dto.*;
import com.pet.hospital.entity.Vaccine;
import com.pet.hospital.entity.VaccineBatch;
import com.pet.hospital.entity.VaccineScrapRecord;
import com.pet.hospital.repository.VaccineBatchRepository;
import com.pet.hospital.repository.VaccineRepository;
import com.pet.hospital.repository.VaccineScrapRecordRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VaccineService {

    private final VaccineRepository vaccineRepository;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final VaccineScrapRecordRepository vaccineScrapRecordRepository;

    private static final int EXPIRY_WARNING_DAYS = 30;

    public VaccineService(VaccineRepository vaccineRepository,
                          VaccineBatchRepository vaccineBatchRepository,
                          VaccineScrapRecordRepository vaccineScrapRecordRepository) {
        this.vaccineRepository = vaccineRepository;
        this.vaccineBatchRepository = vaccineBatchRepository;
        this.vaccineScrapRecordRepository = vaccineScrapRecordRepository;
    }

    public List<Vaccine> getAllVaccines() {
        return vaccineRepository.findAll();
    }

    public List<VaccineStockDTO> getVaccineStock() {
        List<Vaccine> vaccines = vaccineRepository.findAll();
        return vaccines.stream().map(this::convertToStockDTO).collect(Collectors.toList());
    }

    private VaccineStockDTO convertToStockDTO(Vaccine vaccine) {
        VaccineStockDTO dto = new VaccineStockDTO();
        dto.setVaccineId(vaccine.getId());
        dto.setVaccineName(vaccine.getName());
        dto.setDescription(vaccine.getDescription());
        dto.setManufacturer(vaccine.getManufacturer());

        List<VaccineBatch> batches = vaccineBatchRepository.findByVaccineIdOrderByExpiryDateAsc(vaccine.getId());
        dto.setBatches(batches.stream().map(this::convertToBatchDTO).collect(Collectors.toList()));

        Integer total = vaccineBatchRepository.sumQuantityByVaccineId(vaccine.getId());
        dto.setTotalQuantity(total != null ? total : 0);

        return dto;
    }

    private VaccineBatchDTO convertToBatchDTO(VaccineBatch batch) {
        VaccineBatchDTO dto = new VaccineBatchDTO();
        dto.setId(batch.getId());
        dto.setVaccineId(batch.getVaccine().getId());
        dto.setVaccineName(batch.getVaccine().getName());
        dto.setBatchNumber(batch.getBatchNumber());
        dto.setProductionDate(batch.getProductionDate());
        dto.setExpiryDate(batch.getExpiryDate());
        dto.setQuantity(batch.getQuantity());

        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), batch.getExpiryDate());
        dto.setDaysUntilExpiry(daysUntilExpiry);
        dto.setIsExpiring(daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry >= 0);

        return dto;
    }

    @Cacheable(value = "expiringBatches", key = "'all'")
    public List<VaccineBatchDTO> getExpiringBatches() {
        LocalDate today = LocalDate.now();
        LocalDate expiryDate = today.plusDays(EXPIRY_WARNING_DAYS);
        List<VaccineBatch> expiringBatches = vaccineBatchRepository.findExpiringBatches(today, expiryDate);
        return expiringBatches.stream().map(this::convertToBatchDTO).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "expiringBatches", key = "'all'")
    public UseVaccineResponse useVaccine(UseVaccineRequest request) {
        Vaccine vaccine = vaccineRepository.findById(request.getVaccineId())
                .orElseThrow(() -> new RuntimeException("疫苗不存在"));

        Integer totalAvailable = vaccineBatchRepository.sumQuantityByVaccineId(request.getVaccineId());
        totalAvailable = totalAvailable != null ? totalAvailable : 0;

        if (totalAvailable < request.getQuantity()) {
            UseVaccineResponse response = new UseVaccineResponse();
            response.setSuccess(false);
            response.setMessage("库存不足！当前库存: " + totalAvailable + "，需要: " + request.getQuantity());
            response.setVaccineId(vaccine.getId());
            response.setVaccineName(vaccine.getName());
            return response;
        }

        List<VaccineBatch> availableBatches = vaccineBatchRepository.findAvailableBatchesByVaccineId(request.getVaccineId());
        int remainingToUse = request.getQuantity();
        List<UsedBatchDTO> usedBatches = new ArrayList<>();

        for (VaccineBatch batch : availableBatches) {
            if (remainingToUse <= 0) {
                break;
            }

            int availableInBatch = batch.getQuantity();
            int usedFromBatch = Math.min(availableInBatch, remainingToUse);

            batch.setQuantity(availableInBatch - usedFromBatch);
            vaccineBatchRepository.save(batch);

            UsedBatchDTO usedBatchDTO = new UsedBatchDTO();
            usedBatchDTO.setBatchId(batch.getId());
            usedBatchDTO.setBatchNumber(batch.getBatchNumber());
            usedBatchDTO.setUsedQuantity(usedFromBatch);
            usedBatchDTO.setRemainingQuantity(batch.getQuantity());
            usedBatchDTO.setExpiryDate(batch.getExpiryDate());
            usedBatchDTO.setDaysUntilExpiry(ChronoUnit.DAYS.between(LocalDate.now(), batch.getExpiryDate()));
            usedBatches.add(usedBatchDTO);

            remainingToUse -= usedFromBatch;
        }

        Integer remainingQuantity = vaccineBatchRepository.sumQuantityByVaccineId(request.getVaccineId());
        remainingQuantity = remainingQuantity != null ? remainingQuantity : 0;

        UseVaccineResponse response = new UseVaccineResponse();
        response.setSuccess(true);
        response.setMessage("疫苗使用成功！");
        response.setVaccineId(vaccine.getId());
        response.setVaccineName(vaccine.getName());
        response.setTotalUsed(request.getQuantity() - remainingToUse);
        response.setRemainingQuantity(remainingQuantity);
        response.setUsedBatches(usedBatches);

        return response;
    }

    public List<VaccineBatchDTO> getExpiredBatches() {
        LocalDate today = LocalDate.now();
        List<VaccineBatch> expiredBatches = vaccineBatchRepository.findExpiredBatches(today);
        return expiredBatches.stream().map(this::convertToBatchDTO).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "expiringBatches", key = "'all'")
    public BatchScrapResponse scrapBatches(BatchScrapRequest request) {
        List<VaccineBatch> batches = vaccineBatchRepository.findByIdInAndIsScrappedFalse(request.getBatchIds());

        if (batches.isEmpty()) {
            BatchScrapResponse response = new BatchScrapResponse();
            response.setSuccess(false);
            response.setMessage("没有找到可报废的批次或批次已报废");
            return response;
        }

        String operator = request.getOperator() != null ? request.getOperator() : "系统管理员";
        List<ScrapRecordDTO> records = new ArrayList<>();
        int totalScrapped = 0;

        for (VaccineBatch batch : batches) {
            batch.setIsScrapped(true);
            batch.setScrapReason(request.getReason());
            batch.setScrappedAt(LocalDateTime.now());
            vaccineBatchRepository.save(batch);

            VaccineScrapRecord scrapRecord = new VaccineScrapRecord();
            scrapRecord.setVaccineBatch(batch);
            scrapRecord.setBatchNumber(batch.getBatchNumber());
            scrapRecord.setVaccineName(batch.getVaccine().getName());
            scrapRecord.setScrapQuantity(batch.getQuantity());
            scrapRecord.setReason(request.getReason());
            scrapRecord.setOperator(operator);
            vaccineScrapRecordRepository.save(scrapRecord);

            ScrapRecordDTO recordDTO = convertToScrapRecordDTO(scrapRecord);
            records.add(recordDTO);
            totalScrapped += batch.getQuantity();
        }

        BatchScrapResponse response = new BatchScrapResponse();
        response.setSuccess(true);
        response.setMessage("成功报废 " + batches.size() + " 个批次，共 " + totalScrapped + " 支疫苗");
        response.setTotalScrapped(totalScrapped);
        response.setRecords(records);

        return response;
    }

    public List<ScrapRecordDTO> getAllScrapRecords() {
        List<VaccineScrapRecord> records = vaccineScrapRecordRepository.findAllByOrderByScrappedAtDesc();
        return records.stream().map(this::convertToScrapRecordDTO).collect(Collectors.toList());
    }

    private ScrapRecordDTO convertToScrapRecordDTO(VaccineScrapRecord record) {
        ScrapRecordDTO dto = new ScrapRecordDTO();
        dto.setId(record.getId());
        dto.setBatchId(record.getVaccineBatch().getId());
        dto.setBatchNumber(record.getBatchNumber());
        dto.setVaccineName(record.getVaccineName());
        dto.setScrapQuantity(record.getScrapQuantity());
        dto.setReason(record.getReason());
        dto.setScrappedAt(record.getScrappedAt());
        dto.setOperator(record.getOperator());
        return dto;
    }
}
