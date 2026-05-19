package com.music.controller;

import com.music.config.JwtUtil;
import com.music.dto.ApiResponse;
import com.music.dto.MusicDTO;
import com.music.service.MusicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/musics")
public class MusicController {

    @Autowired
    private MusicService musicService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MusicDTO>> uploadMusic(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String title,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String album,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String description,
            @RequestParam("musicFile") MultipartFile musicFile,
            @RequestParam(value = "coverFile", required = false) MultipartFile coverFile) {

        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);

        ApiResponse<MusicDTO> response = musicService.uploadMusic(
                userId, title, artist, album, tags, description, musicFile, coverFile);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/list")
    public ResponseEntity<ApiResponse<Page<MusicDTO>>> getApprovedMusics(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        ApiResponse<Page<MusicDTO>> response = musicService.getApprovedMusics(page, size, keyword);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/hot")
    public ResponseEntity<ApiResponse<List<MusicDTO>>> getHotMusics(
            @RequestParam(defaultValue = "10") int limit) {
        ApiResponse<List<MusicDTO>> response = musicService.getHotMusics(limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/tag/{tag}")
    public ResponseEntity<ApiResponse<List<MusicDTO>>> getMusicsByTag(@PathVariable String tag) {
        ApiResponse<List<MusicDTO>> response = musicService.getMusicsByTag(tag);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<MusicDTO>> getMusicDetail(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            userId = jwtUtil.extractUserId(token);
        }

        ApiResponse<MusicDTO> response = musicService.getMusicDetail(id, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-uploads")
    public ResponseEntity<ApiResponse<List<MusicDTO>>> getMyUploads(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<List<MusicDTO>> response = musicService.getMyUploads(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<MusicDTO>>> getPendingMusics(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        ApiResponse<Page<MusicDTO>> response = musicService.getPendingMusics(page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MusicDTO>> approveMusic(@PathVariable Long id) {
        ApiResponse<MusicDTO> response = musicService.approveMusic(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MusicDTO>> rejectMusic(@PathVariable Long id) {
        ApiResponse<MusicDTO> response = musicService.rejectMusic(id);
        return ResponseEntity.ok(response);
    }
}
