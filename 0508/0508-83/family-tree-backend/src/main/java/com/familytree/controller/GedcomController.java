package com.familytree.controller;

import com.familytree.entity.FamilySpace;
import com.familytree.service.FamilySpaceService;
import com.familytree.service.GedcomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/family-spaces/{familySpaceId}/gedcom")
@CrossOrigin
public class GedcomController {
    @Autowired
    private GedcomService gedcomService;

    @Autowired
    private FamilySpaceService familySpaceService;

    @PostMapping("/import")
    public ResponseEntity<?> importGedcom(@PathVariable Long familySpaceId, 
                                          @RequestParam("file") MultipartFile file) {
        try {
            FamilySpace space = familySpaceService.getFamilySpace(familySpaceId);
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            gedcomService.importGedcom(familySpaceId, content, space);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "GEDCOM导入成功");
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "文件读取失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "GEDCOM导入失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/export")
    public ResponseEntity<?> exportGedcom(@PathVariable Long familySpaceId) {
        try {
            FamilySpace space = familySpaceService.getFamilySpace(familySpaceId);
            String gedcomContent = gedcomService.exportGedcom(familySpaceId, space);
            String filename = "family_tree_" + familySpaceId + ".ged";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/octet-stream"))
                .body(gedcomContent.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "GEDCOM导出失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
