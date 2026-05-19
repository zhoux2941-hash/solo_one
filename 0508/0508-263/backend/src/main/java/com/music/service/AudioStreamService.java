package com.music.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Service
public class AudioStreamService {

    private static final long CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    private static final String DEFAULT_CONTENT_TYPE = "audio/mpeg";

    @Autowired
    private FileStorageService fileStorageService;

    public ResponseEntity<StreamingResponseBody> streamAudio(String fileName, String rangeHeader) {
        try {
            Resource resource = fileStorageService.loadMusicFile(fileName);
            File file = resource.getFile();
            long fileLength = file.length();

            Path filePath = Paths.get(file.getAbsolutePath());

            if (rangeHeader == null) {
                return streamFullFile(filePath, fileLength, fileName);
            } else {
                return streamPartialFile(filePath, fileLength, fileName, rangeHeader);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private ResponseEntity<StreamingResponseBody> streamFullFile(Path filePath, long fileLength, String fileName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(getContentType(fileName)));
        headers.setContentLength(fileLength);
        headers.set("Accept-Ranges", "bytes");
        headers.setCacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic().getHeaderValue());

        StreamingResponseBody responseBody = outputStream -> {
            try (FileChannel fileChannel = FileChannel.open(filePath);
                 InputStream inputStream = Channels.newInputStream(fileChannel)) {
                byte[] buffer = new byte[(int) CHUNK_SIZE];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                    outputStream.flush();
                }
            } catch (IOException e) {
                // Client disconnected, this is normal
            }
        };

        return new ResponseEntity<>(responseBody, headers, HttpStatus.OK);
    }

    private ResponseEntity<StreamingResponseBody> streamPartialFile(Path filePath, long fileLength, 
                                                                      String fileName, String rangeHeader) {
        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long rangeStart = ranges[0].isEmpty() ? 0 : Long.parseLong(ranges[0]);
        long rangeEnd = ranges.length > 1 && !ranges[1].isEmpty() 
            ? Long.parseLong(ranges[1]) 
            : Math.min(rangeStart + CHUNK_SIZE - 1, fileLength - 1);

        if (rangeStart >= fileLength) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header("Content-Range", "bytes */" + fileLength)
                    .build();
        }

        long contentLength = rangeEnd - rangeStart + 1;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(getContentType(fileName)));
        headers.setContentLength(contentLength);
        headers.set("Content-Range", "bytes " + rangeStart + "-" + rangeEnd + "/" + fileLength);
        headers.set("Accept-Ranges", "bytes");
        headers.setCacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic().getHeaderValue());

        final long finalRangeStart = rangeStart;
        final long finalRangeEnd = rangeEnd;

        StreamingResponseBody responseBody = outputStream -> {
            try (FileChannel fileChannel = FileChannel.open(filePath);
                 InputStream inputStream = Channels.newInputStream(fileChannel.position(finalRangeStart))) {
                
                byte[] buffer = new byte[8192]; // 8KB buffer for better performance
                long bytesRemaining = contentLength;
                int bytesRead;
                
                while (bytesRemaining > 0 && (bytesRead = inputStream.read(buffer, 0, 
                        (int) Math.min(buffer.length, bytesRemaining))) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                    outputStream.flush();
                    bytesRemaining -= bytesRead;
                }
            } catch (IOException e) {
                // Client disconnected, this is normal
            }
        };

        return new ResponseEntity<>(responseBody, headers, HttpStatus.PARTIAL_CONTENT);
    }

    private String getContentType(String fileName) {
        String lowerName = fileName.toLowerCase();
        if (lowerName.endsWith(".mp3")) {
            return "audio/mpeg";
        } else if (lowerName.endsWith(".wav")) {
            return "audio/wav";
        } else if (lowerName.endsWith(".ogg")) {
            return "audio/ogg";
        } else if (lowerName.endsWith(".flac")) {
            return "audio/flac";
        } else if (lowerName.endsWith(".m4a")) {
            return "audio/mp4";
        } else if (lowerName.endsWith(".aac")) {
            return "audio/aac";
        }
        return DEFAULT_CONTENT_TYPE;
    }
}
