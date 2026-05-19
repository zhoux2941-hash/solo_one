package com.music.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.path}")
    private String musicUploadPath;

    @Value("${file.upload.cover-path}")
    private String coverUploadPath;

    private Path musicPath;
    private Path coverPath;

    @PostConstruct
    public void init() {
        musicPath = Paths.get(musicUploadPath).toAbsolutePath().normalize();
        coverPath = Paths.get(coverUploadPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(musicPath);
            Files.createDirectories(coverPath);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directories", ex);
        }
    }

    public String storeMusicFile(MultipartFile file) {
        return storeFile(file, musicPath);
    }

    public String storeCoverFile(MultipartFile file) {
        return storeFile(file, coverPath);
    }

    private String storeFile(MultipartFile file, Path path) {
        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String fileName = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = path.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName, ex);
        }
    }

    public Resource loadMusicFile(String fileName) {
        return loadFile(fileName, musicPath);
    }

    public Resource loadCoverFile(String fileName) {
        return loadFile(fileName, coverPath);
    }

    private Resource loadFile(String fileName, Path path) {
        try {
            Path filePath = path.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found " + fileName, ex);
        }
    }
}
