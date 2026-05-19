package com.smartparking.controller;

import com.smartparking.common.Result;
import com.smartparking.entity.Visitor;
import com.smartparking.service.VisitorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/visitor")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VisitorController {

    private final VisitorService visitorService;

    @GetMapping("/list")
    public Result<Page<Visitor>> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String plateNumber,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Visitor> result = visitorService.findVisitors(name, phone, plateNumber, status, page, size);
        return Result.success(result);
    }

    @GetMapping("/today")
    public Result<List<Visitor>> today() {
        return Result.success(visitorService.findTodayVisitors());
    }

    @GetMapping("/{id}")
    public Result<Visitor> getById(@PathVariable Long id) {
        return Result.success(visitorService.findById(id));
    }

    @PostMapping("/create")
    public Result<Visitor> create(@RequestBody Visitor visitor) {
        Visitor saved = visitorService.createVisitor(visitor);
        return Result.success("登记成功", saved);
    }

    @PutMapping("/{id}")
    public Result<Visitor> update(@PathVariable Long id, @RequestBody Visitor visitor) {
        Visitor updated = visitorService.updateVisitor(id, visitor);
        return Result.success("更新成功", updated);
    }

    @PostMapping("/{id}/checkout")
    public Result<Void> checkOut(@PathVariable Long id) {
        visitorService.checkOutVisitor(id);
        return Result.success("访客已离场");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        visitorService.deleteVisitor(id);
        return Result.success("删除成功");
    }

    @PostMapping("/import")
    public Result<Map<String, Object>> batchImport(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = visitorService.batchImport(file);
        return Result.success("导入完成", result);
    }

    @GetMapping("/export")
    public ResponseEntity<String> export(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String plateNumber,
            @RequestParam(required = false) String status) {

        List<Visitor> list = visitorService.exportVisitors(name, phone, plateNumber, status);

        StringBuilder sb = new StringBuilder();
        sb.append("ID,姓名,手机号,车牌号,访问时长(小时),访问事由,被访人,状态,入场时间,过期时间,离场时间,备注\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (Visitor v : list) {
            sb.append(v.getId()).append(",");
            sb.append(v.getName()).append(",");
            sb.append(v.getPhone()).append(",");
            sb.append(v.getPlateNumber() != null ? v.getPlateNumber() : "").append(",");
            sb.append(v.getDurationHours() != null ? v.getDurationHours() : "").append(",");
            sb.append(v.getReason() != null ? v.getReason() : "").append(",");
            sb.append(v.getHost() != null ? v.getHost() : "").append(",");
            sb.append(v.getStatus() != null ? v.getStatus() : "").append(",");
            sb.append(v.getEntryTime() != null ? v.getEntryTime().format(formatter) : "").append(",");
            sb.append(v.getExpireTime() != null ? v.getExpireTime().format(formatter) : "").append(",");
            sb.append(v.getExitTime() != null ? v.getExitTime().format(formatter) : "").append(",");
            sb.append(v.getRemark() != null ? v.getRemark() : "").append("\n");
        }

        String filename = "访客记录_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDispositionFormData("attachment", new String(filename.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1));

        return ResponseEntity.ok().headers(headers).body(sb.toString());
    }

    @GetMapping("/template")
    public ResponseEntity<String> downloadTemplate() {
        String content = visitorService.generateCsvTemplate();
        String filename = "访客批量导入模板.csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDispositionFormData("attachment", new String(filename.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1));

        return ResponseEntity.ok().headers(headers).body(content);
    }

    @GetMapping("/statistics")
    public Result<Map<String, Long>> statistics() {
        return Result.success(visitorService.getStatistics());
    }
}
