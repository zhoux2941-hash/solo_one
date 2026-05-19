package com.music.service;

import com.music.dto.ApiResponse;
import com.music.dto.MusicDTO;
import com.music.dto.PlaylistDTO;
import com.music.entity.Music;
import com.music.entity.Playlist;
import com.music.entity.PlaylistMusic;
import com.music.entity.User;
import com.music.repository.MusicRepository;
import com.music.repository.PlaylistMusicRepository;
import com.music.repository.PlaylistRepository;
import com.music.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlaylistService {

    @Autowired
    private PlaylistRepository playlistRepository;

    @Autowired
    private PlaylistMusicRepository playlistMusicRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MusicRepository musicRepository;

    @Transactional
    public ApiResponse<PlaylistDTO> createPlaylist(Long userId, String name, String description, Boolean isPublic) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }

        Playlist playlist = new Playlist();
        playlist.setName(name);
        playlist.setDescription(description);
        playlist.setIsPublic(isPublic != null ? isPublic : false);
        playlist.setUser(user);

        playlist = playlistRepository.save(playlist);
        return ApiResponse.success("创建成功", PlaylistDTO.fromEntity(playlist));
    }

    public ApiResponse<List<PlaylistDTO>> getMyPlaylists(Long userId) {
        List<Playlist> playlists = playlistRepository.findByUserId(userId);
        List<PlaylistDTO> dtoList = playlists.stream().map(PlaylistDTO::fromEntity).collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }

    public ApiResponse<List<PlaylistDTO>> getPublicPlaylists() {
        List<Playlist> playlists = playlistRepository.findByIsPublicTrue();
        List<PlaylistDTO> dtoList = playlists.stream().map(PlaylistDTO::fromEntity).collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }

    @Transactional
    public ApiResponse<String> addMusicToPlaylist(Long userId, Long playlistId, Long musicId) {
        Playlist playlist = playlistRepository.findById(playlistId).orElse(null);
        if (playlist == null) {
            return ApiResponse.error("歌单不存在");
        }

        if (!playlist.getUser().getId().equals(userId)) {
            return ApiResponse.error("无权操作此歌单");
        }

        Music music = musicRepository.findById(musicId).orElse(null);
        if (music == null) {
            return ApiResponse.error("音乐不存在");
        }

        if (playlistMusicRepository.existsByPlaylistIdAndMusicId(playlistId, musicId)) {
            return ApiResponse.error("音乐已在歌单中");
        }

        PlaylistMusic playlistMusic = new PlaylistMusic();
        playlistMusic.setPlaylist(playlist);
        playlistMusic.setMusic(music);
        playlistMusicRepository.save(playlistMusic);

        return ApiResponse.success("添加成功", null);
    }

    @Transactional
    public ApiResponse<String> removeMusicFromPlaylist(Long userId, Long playlistId, Long musicId) {
        Playlist playlist = playlistRepository.findById(playlistId).orElse(null);
        if (playlist == null) {
            return ApiResponse.error("歌单不存在");
        }

        if (!playlist.getUser().getId().equals(userId)) {
            return ApiResponse.error("无权操作此歌单");
        }

        playlistMusicRepository.deleteByPlaylistIdAndMusicId(playlistId, musicId);
        return ApiResponse.success("移除成功", null);
    }

    public ApiResponse<List<MusicDTO>> getPlaylistMusics(Long playlistId) {
        List<PlaylistMusic> playlistMusics = playlistMusicRepository.findByPlaylistIdOrderByOrderNum(playlistId);
        List<MusicDTO> dtoList = playlistMusics.stream()
                .map(pm -> MusicDTO.fromEntity(pm.getMusic()))
                .collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }
}
