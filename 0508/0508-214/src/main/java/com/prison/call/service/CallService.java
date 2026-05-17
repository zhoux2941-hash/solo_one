package com.prison.call.service;

import com.prison.call.entity.Alert;
import com.prison.call.entity.CallRecord;
import com.prison.call.entity.Inmate;
import com.prison.call.repository.AlertRepository;
import com.prison.call.repository.CallRecordRepository;
import com.prison.call.repository.InmateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CallService {
    
    @Autowired
    private CallRecordRepository callRecordRepository;
    
    @Autowired
    private InmateRepository inmateRepository;
    
    @Autowired
    private AlertRepository alertRepository;
    
    @Autowired
    private SensitiveWordService sensitiveWordService;
    
    public Map<String, Object> checkQuota(Long inmateId) {
        Optional<Inmate> inmateOpt = inmateRepository.findById(inmateId);
        if (inmateOpt.isEmpty()) {
            return Map.of("allowed", false, "message", "服刑人员不存在");
        }
        
        Inmate inmate = inmateOpt.get();
        
        LocalDateTime startOfMonth = LocalDateTime.of(LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()), LocalTime.MIN);
        LocalDateTime endOfMonth = LocalDateTime.of(LocalDate.now().with(TemporalAdjusters.lastDayOfMonth()), LocalTime.MAX);
        
        Integer callCount = callRecordRepository.countByInmateIdAndMonth(inmateId, startOfMonth, endOfMonth);
        
        boolean allowed = callCount < inmate.getMonthlyQuota();
        
        return Map.of(
            "allowed", allowed,
            "used", callCount,
            "quota", inmate.getMonthlyQuota(),
            "maxDuration", inmate.getMaxDurationMinutes(),
            "message", allowed ? "可以通话" : "本月通话配额已用完"
        );
    }
    
    public CallRecord startCall(Long inmateId, String calledNumber, String calledPerson) {
        Optional<Inmate> inmateOpt = inmateRepository.findById(inmateId);
        if (inmateOpt.isEmpty()) {
            throw new RuntimeException("服刑人员不存在");
        }
        
        Inmate inmate = inmateOpt.get();
        
        CallRecord record = new CallRecord();
        record.setInmateId(inmateId);
        record.setInmateName(inmate.getName());
        record.setInmateNo(inmate.getInmateNo());
        record.setPrisonArea(inmate.getPrisonArea());
        record.setCalledNumber(calledNumber);
        record.setCalledPerson(calledPerson);
        record.setStartTime(LocalDateTime.now());
        record.setStatus("ONGOING");
        
        return callRecordRepository.save(record);
    }
    
    public CallRecord endCall(Long callId, String transcription) {
        Optional<CallRecord> recordOpt = callRecordRepository.findById(callId);
        if (recordOpt.isEmpty()) {
            throw new RuntimeException("通话记录不存在");
        }
        
        CallRecord record = recordOpt.get();
        record.setEndTime(LocalDateTime.now());
        record.setStatus("COMPLETED");
        
        if (record.getStartTime() != null) {
            long seconds = java.time.Duration.between(record.getStartTime(), record.getEndTime()).getSeconds();
            record.setDurationSeconds((int) seconds);
        }
        
        record.setTranscription(transcription);
        
        List<String> sensitiveWords = sensitiveWordService.detectSensitiveWords(transcription);
        if (!sensitiveWords.isEmpty()) {
            record.setHasSensitiveWord(true);
            record.setSensitiveWordsFound(String.join(",", sensitiveWords));
            
            Alert alert = new Alert();
            alert.setCallRecordId(callId);
            alert.setInmateId(record.getInmateId());
            alert.setInmateName(record.getInmateName());
            alert.setPrisonArea(record.getPrisonArea());
            alert.setSensitiveWords(String.join(",", sensitiveWords));
            alert.setTranscription(transcription);
            alertRepository.save(alert);
        }
        
        return callRecordRepository.save(record);
    }
    
    public List<CallRecord> getAllCallRecords() {
        return callRecordRepository.findAll();
    }
    
    public List<CallRecord> getCallRecordsByInmate(Long inmateId) {
        return callRecordRepository.findByInmateId(inmateId);
    }
    
    public List<CallRecord> getSensitiveCallRecords() {
        return callRecordRepository.findByHasSensitiveWordTrue();
    }
    
    public Optional<CallRecord> getCallRecordById(Long id) {
        return callRecordRepository.findById(id);
    }
}
