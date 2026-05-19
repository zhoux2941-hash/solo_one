package com.music.controller;

import com.music.config.JwtUtil;
import com.music.dto.ApiResponse;
import com.music.dto.MusicDTO;
import com.music.dto.PlaylistDTO;
import com.music.service.PlaylistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    @Autowired
    private PlaylistService playlistService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<PlaylistDTO>> createPlaylist(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "false") Boolean isPublic) {

        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<PlaylistDTO> response = playlistService.createPlaylist(userId, name, description, isPublic);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<PlaylistDTO>>> getMyPlaylists(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<List<PlaylistDTO>> response = playlistService.getMyPlaylists(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<PlaylistDTO>>> getPublicPlaylists() {
        ApiResponse<List<PlaylistDTO>> response = playlistService.getPublicPlaylists();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{playlistId}/musics/{musicId}")
    public ResponseEntity<ApiResponse<String>> addMusicToPlaylist(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long playlistId,
            @PathVariable Long musicId) {

        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<String> response = playlistService.addMusicToPlaylist(userId, playlistId, musicId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{playlistId}/musics/{musicId}")
    public ResponseEntity<ApiResponse<String>> removeMusicFromPlaylist(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long playlistId,
            @PathVariable Long musicId) {

        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<String> response = playlistService.removeMusicFromPlaylist(userId, playlistId, musicId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{playlistId}/musics")
    public ResponseEntity<ApiResponse<List<MusicDTO>>> getPlaylistMusics(@PathVariable Long playlistId) {
        ApiResponse<List<MusicDTO>> response = playlistService.getPlaylistMusics(playlistId);
        return ResponseEntity.ok(response);
    }
}
