package com.escaperoom.controller;

import com.escaperoom.dto.ScriptDTO;
import com.escaperoom.service.PdfService;
import com.escaperoom.service.ScriptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scripts")
public class ScriptController {
    @Autowired
    private ScriptService scriptService;

    @Autowired
    private PdfService pdfService;

    @GetMapping
    public List<ScriptDTO> getAllScripts() {
        return scriptService.getAllScripts();
    }

    @GetMapping("/{id}")
    public ScriptDTO getScriptById(@PathVariable Long id) {
        return scriptService.getScriptById(id);
    }

    @PostMapping
    public ScriptDTO createScript(@RequestBody ScriptDTO dto) {
        return scriptService.createScript(dto);
    }

    @PutMapping("/{id}")
    public ScriptDTO updateScript(@PathVariable Long id, @RequestBody ScriptDTO dto) {
        return scriptService.updateScript(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteScript(@PathVariable Long id) {
        scriptService.deleteScript(id);
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportToPdf(@PathVariable Long id) {
        try {
            ScriptDTO script = scriptService.getScriptById(id);
            byte[] pdfData = pdfService.generateScriptPdf(script);
            
            String filename = new String((script.getName() + ".pdf").getBytes("UTF-8"), "ISO-8859-1");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfData);
        } catch (Exception e) {
            throw new RuntimeException("导出PDF失败: " + e.getMessage());
        }
    }
}
