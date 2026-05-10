package com.crew.controller;

import com.crew.config.JwtConfig;
import com.crew.dto.NoticeCreateRequest;
import com.crew.entity.Notice;
import com.crew.service.NoticeService;
import com.crew.service.PdfExportService;
import com.crew.service.WeatherService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {
    
    @Autowired
    private NoticeService noticeService;
    
    @Autowired
    private JwtConfig jwtConfig;
    
    @Autowired
    private PdfExportService pdfExportService;
    
    @Autowired
    private WeatherService weatherService;
    
    private Long getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String token = authHeader.substring(7);
        return jwtConfig.getUserIdFromToken(token);
    }
    
    @PostMapping
    public ResponseEntity<?> createNotice(@Valid @RequestBody NoticeCreateRequest request, 
                                           HttpServletRequest httpRequest) {
        try {
            Long directorId = getCurrentUserId(httpRequest);
            Notice notice = noticeService.createNotice(request, directorId);
            return ResponseEntity.ok(convertToNoticeDTO(notice));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    
    @GetMapping("/by-date")
    public ResponseEntity<?> getNoticesByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Notice> notices = noticeService.getNoticesByDate(date);
        List<Map<String, Object>> result = notices.stream()
                .map(this::convertToNoticeDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/my")
    public ResponseEntity<?> getMyNotices(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpServletRequest httpRequest) {
        Long actorId = getCurrentUserId(httpRequest);
        List<Notice> notices;
        
        if (date != null) {
            notices = noticeService.getActorNotices(actorId, date);
        } else {
            notices = noticeService.getAllActorNotices(actorId);
        }
        
        Map<LocalDate, List<Map<String, Object>>> grouped = notices.stream()
                .map(this::convertToNoticeDTO)
                .collect(Collectors.groupingBy(
                        dto -> (LocalDate) dto.get("noticeDate")
                ));
        
        return ResponseEntity.ok(grouped);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getNoticeById(@PathVariable Long id) {
        Notice notice = noticeService.getById(id);
        return ResponseEntity.ok(convertToNoticeDTO(notice));
    }
    
    @PutMapping("/{id}/confirm-materials")
    public ResponseEntity<?> confirmMaterials(@PathVariable Long id) {
        try {
            Notice notice = noticeService.confirmMaterials(id);
            return ResponseEntity.ok(convertToNoticeDTO(notice));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    
    @GetMapping("/weather")
    public ResponseEntity<?> getWeather(
            @RequestParam(required = false, defaultValue = "Beijing") String location,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        Map<String, Object> weather = weatherService.getWeather(location, date);
        return ResponseEntity.ok(weather);
    }
    
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, defaultValue = "Beijing") String location) {
        try {
            List<Notice> notices = noticeService.getNoticesByDate(date);
            byte[] pdfBytes = pdfExportService.exportNoticesToPdf(notices, date, location);
            
            String filename = "通告单_" + date.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".pdf";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private Map<String, Object> convertToNoticeDTO(Notice notice) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", notice.getId());
        dto.put("noticeDate", notice.getNoticeDate());
        dto.put("sceneName", notice.getSceneName());
        dto.put("startTime", notice.getStartTime());
        dto.put("endTime", notice.getEndTime());
        dto.put("costumeRequirement", notice.getCostumeRequirement());
        dto.put("propRequirement", notice.getPropRequirement());
        dto.put("materialsReady", notice.getMaterialsReady());
        
        if (notice.getDirector() != null) {
            dto.put("director", Map.of(
                "id", notice.getDirector().getId(),
                "name", notice.getDirector().getName()
            ));
        }
        
        if (notice.getActors() != null) {
            dto.put("actors", notice.getActors().stream()
                    .map(actor -> Map.of(
                        "id", actor.getId(),
                        "name", actor.getName()
                    ))
                    .collect(Collectors.toList()));
        }
        
        return dto;
    }
}