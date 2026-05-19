package com.music.controller;

import com.music.service.AudioStreamService;
import com.music.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AudioStreamService audioStreamService;

    @Async
    @GetMapping("/music/{fileName:.+}")
    public ResponseEntity<StreamingResponseBody> streamMusicFile(
            @PathVariable String fileName,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {
        
        return audioStreamService.streamAudio(fileName, rangeHeader);
    }

    @GetMapping("/cover/{fileName:.+}")
    public ResponseEntity<Resource> downloadCoverFile(@PathVariable String fileName, HttpServletRequest request) {
        Resource resource = fileStorageService.loadCoverFile(fileName);

        String contentType = "application/octet-stream";
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .cacheControl(CacheControl.maxAge(24, TimeUnit.HOURS).cachePublic())
                .body(resource);
    }
}
