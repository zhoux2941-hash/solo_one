package com.logistics.track.controller;

import com.logistics.track.dto.TrackDTO;
import com.logistics.track.entity.Track;
import com.logistics.track.service.TrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    @GetMapping("/package/{packageId}")
    public ResponseEntity<List<TrackDTO>> getTracksByPackageId(@PathVariable Long packageId) {
        return ResponseEntity.ok(trackService.getTracksByPackageId(packageId));
    }

    @GetMapping("/package/{packageId}/page")
    public ResponseEntity<Page<TrackDTO>> getTracksPaginated(
            @PathVariable Long packageId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(trackService.getTracksByPackageIdPaginated(packageId, page, size));
    }

    @PostMapping("/package/{packageId}")
    public ResponseEntity<Track> addTrack(@PathVariable Long packageId, @RequestBody Track track) {
        return ResponseEntity.ok(trackService.addTrack(packageId, track));
    }
}
