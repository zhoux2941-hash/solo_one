package com.music.service;

import com.music.config.JwtUtil;
import com.music.dto.ApiResponse;
import com.music.dto.MusicDTO;
import com.music.entity.Music;
import com.music.entity.PlayHistory;
import com.music.entity.User;
import com.music.repository.MusicRepository;
import com.music.repository.PlayHistoryRepository;
import com.music.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MusicService {

    @Autowired
    private MusicRepository musicRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlayHistoryRepository playHistoryRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public ApiResponse<MusicDTO> uploadMusic(Long userId, String title, String artist, String album,
                                             String tags, String description, MultipartFile musicFile,
                                             MultipartFile coverFile) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }

        String musicFileName = fileStorageService.storeMusicFile(musicFile);
        String coverFileName = coverFile != null ? fileStorageService.storeCoverFile(coverFile) : null;

        Music music = new Music();
        music.setTitle(title);
        music.setArtist(artist);
        music.setAlbum(album);
        music.setTags(tags);
        music.setDescription(description);
        music.setFilePath(musicFileName);
        music.setCover(coverFileName);
        music.setUploader(user);
        music.setStatus("PENDING");

        music = musicRepository.save(music);

        return ApiResponse.success("上传成功，等待审核", MusicDTO.fromEntity(music));
    }

    public ApiResponse<Page<MusicDTO>> getApprovedMusics(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Music> musics;
        if (keyword != null && !keyword.isEmpty()) {
            musics = musicRepository.findByStatusAndTitleContaining("APPROVED", keyword, pageable);
        } else {
            musics = musicRepository.findByStatus("APPROVED", pageable);
        }
        Page<MusicDTO> dtoPage = musics.map(MusicDTO::fromEntity);
        return ApiResponse.success(dtoPage);
    }

    public ApiResponse<Page<MusicDTO>> getPendingMusics(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<Music> musics = musicRepository.findByStatus("PENDING", pageable);
        Page<MusicDTO> dtoPage = musics.map(MusicDTO::fromEntity);
        return ApiResponse.success(dtoPage);
    }

    @Transactional
    public ApiResponse<MusicDTO> approveMusic(Long musicId) {
        Music music = musicRepository.findById(musicId).orElse(null);
        if (music == null) {
            return ApiResponse.error("音乐不存在");
        }
        music.setStatus("APPROVED");
        music = musicRepository.save(music);
        return ApiResponse.success("审核通过", MusicDTO.fromEntity(music));
    }

    @Transactional
    public ApiResponse<MusicDTO> rejectMusic(Long musicId) {
        Music music = musicRepository.findById(musicId).orElse(null);
        if (music == null) {
            return ApiResponse.error("音乐不存在");
        }
        music.setStatus("REJECTED");
        music = musicRepository.save(music);
        return ApiResponse.success("已拒绝", MusicDTO.fromEntity(music));
    }

    @Transactional
    public ApiResponse<MusicDTO> getMusicDetail(Long musicId, Long userId) {
        Music music = musicRepository.findById(musicId).orElse(null);
        if (music == null) {
            return ApiResponse.error("音乐不存在");
        }

        music.setPlayCount(music.getPlayCount() + 1);
        musicRepository.save(music);

        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                PlayHistory history = new PlayHistory();
                history.setUser(user);
                history.setMusic(music);
                playHistoryRepository.save(history);
            }
        }

        return ApiResponse.success(MusicDTO.fromEntity(music));
    }

    public ApiResponse<List<MusicDTO>> getHotMusics(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Music> musics = musicRepository.findTopByPlayCount(pageable);
        List<MusicDTO> dtoList = musics.stream().map(MusicDTO::fromEntity).collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }

    public ApiResponse<List<MusicDTO>> getMusicsByTag(String tag) {
        List<Music> musics = musicRepository.findByTag(tag);
        List<MusicDTO> dtoList = musics.stream().map(MusicDTO::fromEntity).collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }

    public ApiResponse<List<MusicDTO>> getMyUploads(Long userId) {
        List<Music> musics = musicRepository.findByUploaderId(userId);
        List<MusicDTO> dtoList = musics.stream().map(MusicDTO::fromEntity).collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }
}
