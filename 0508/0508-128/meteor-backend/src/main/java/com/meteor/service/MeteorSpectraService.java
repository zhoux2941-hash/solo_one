package com.meteor.service;

import com.meteor.dto.*;
import com.meteor.entity.EmissionLine;
import com.meteor.entity.MeteorSpectra;
import com.meteor.entity.SpectrumDataPoint;
import com.meteor.repository.EmissionLineRepository;
import com.meteor.repository.MeteorSpectraRepository;
import com.meteor.repository.SpectrumDataPointRepository;
import com.meteor.util.SpectrumExtractor;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MeteorSpectraService {
    
    private final MeteorSpectraRepository spectraRepository;
    private final EmissionLineRepository emissionLineRepository;
    private final SpectrumDataPointRepository spectrumDataPointRepository;
    
    @Value("${file.upload.path}")
    private String uploadPath;
    
    @Value("${spectra.thumbnail.width:200}")
    private int thumbnailWidth;
    
    @Value("${spectra.thumbnail.height:150}")
    private int thumbnailHeight;
    
    public MeteorSpectraService(MeteorSpectraRepository spectraRepository,
                                 EmissionLineRepository emissionLineRepository,
                                 SpectrumDataPointRepository spectrumDataPointRepository) {
        this.spectraRepository = spectraRepository;
        this.emissionLineRepository = emissionLineRepository;
        this.spectrumDataPointRepository = spectrumDataPointRepository;
    }
    
    @Transactional
    public MeteorSpectra uploadSpectra(MultipartFile file, String uploaderName) throws IOException {
        Files.createDirectories(Paths.get(uploadPath));
        
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String extension = getFileExtension(file.getOriginalFilename());
        String storedFilename = "spectra_" + timestamp + "." + extension;
        
        Path filePath = Paths.get(uploadPath, storedFilename);
        file.transferTo(filePath.toFile());
        
        String thumbnailFilename = "thumb_" + storedFilename;
        Path thumbnailPath = Paths.get(uploadPath, thumbnailFilename);
        createThumbnail(filePath.toFile(), thumbnailPath.toFile());
        
        MeteorSpectra spectra = new MeteorSpectra();
        spectra.setOriginalFilename(file.getOriginalFilename());
        spectra.setStoredFilename(storedFilename);
        spectra.setFilePath(filePath.toString());
        spectra.setThumbnailPath(thumbnailPath.toString());
        spectra.setUploaderName(uploaderName);
        spectra.setViewCount(0L);
        
        return spectraRepository.save(spectra);
    }
    
    @Transactional
    public MeteorSpectra calibrateWavelength(Long spectraId, WavelengthCalibrationRequest request) throws IOException {
        MeteorSpectra spectra = spectraRepository.findById(spectraId)
                .orElseThrow(() -> new RuntimeException("Spectra not found"));
        
        spectra.setMinWavelength(request.getMinWavelength());
        spectra.setMaxWavelength(request.getMaxWavelength());
        spectra.setStartPixelX(request.getStartPixelX());
        spectra.setStartPixelY(request.getStartPixelY());
        spectra.setEndPixelX(request.getEndPixelX());
        spectra.setEndPixelY(request.getEndPixelY());
        
        spectra = spectraRepository.save(spectra);
        
        File imageFile = new File(spectra.getFilePath());
        if (imageFile.exists()) {
            List<SpectrumDataPoint> dataPoints = SpectrumExtractor.extractSpectrum(imageFile, spectra);
            
            spectrumDataPointRepository.deleteByMeteorSpectraId(spectraId);
            for (SpectrumDataPoint point : dataPoints) {
                point.setMeteorSpectra(spectra);
            }
            spectrumDataPointRepository.saveAll(dataPoints);
            
            List<EmissionLine> detectedLines = SpectrumExtractor.detectEmissionLines(
                    dataPoints, spectra, 10.0);
            
            List<EmissionLine> existingAutoLines = emissionLineRepository.findByMeteorSpectraId(spectraId)
                    .stream()
                    .filter(EmissionLine::getIsAutoDetected)
                    .collect(Collectors.toList());
            
            emissionLineRepository.deleteAll(existingAutoLines);
            emissionLineRepository.saveAll(detectedLines);
        }
        
        return spectra;
    }
    
    @Transactional
    public MeteorSpectra updateSpectra(Long spectraId, UpdateSpectraRequest request) {
        MeteorSpectra spectra = spectraRepository.findById(spectraId)
                .orElseThrow(() -> new RuntimeException("Spectra not found"));
        
        if (request.getVelocity() != null) {
            spectra.setVelocity(request.getVelocity());
        }
        if (request.getNotes() != null) {
            spectra.setNotes(request.getNotes());
        }
        if (request.getUploaderName() != null) {
            spectra.setUploaderName(request.getUploaderName());
        }
        
        return spectraRepository.save(spectra);
    }
    
    @Transactional
    public EmissionLine addEmissionLine(Long spectraId, EmissionLineRequest request) {
        MeteorSpectra spectra = spectraRepository.findById(spectraId)
                .orElseThrow(() -> new RuntimeException("Spectra not found"));
        
        EmissionLine line = new EmissionLine();
        line.setMeteorSpectra(spectra);
        line.setElement(request.getElement());
        line.setWavelength(request.getWavelength());
        line.setIntensity(request.getIntensity());
        line.setIsAutoDetected(request.getIsAutoDetected() != null ? request.getIsAutoDetected() : false);
        line.setNotes(request.getNotes());
        
        return emissionLineRepository.save(line);
    }
    
    @Transactional
    public void deleteEmissionLine(Long lineId) {
        emissionLineRepository.deleteById(lineId);
    }
    
    public SpectraDetailResponse getSpectraDetail(Long spectraId) {
        MeteorSpectra spectra = spectraRepository.findById(spectraId)
                .orElseThrow(() -> new RuntimeException("Spectra not found"));
        
        spectra.setViewCount(spectra.getViewCount() + 1);
        spectraRepository.save(spectra);
        
        List<SpectrumDataPoint> dataPoints = spectrumDataPointRepository
                .findByMeteorSpectraIdOrderByPixelIndexAsc(spectraId);
        List<EmissionLine> emissionLines = emissionLineRepository.findByMeteorSpectraId(spectraId);
        
        return convertToDetailResponse(spectra, dataPoints, emissionLines);
    }
    
    @Cacheable(value = "spectra", key = "'list:' + #page + ':' + #size")
    public Page<SpectraResponse> getAllSpectra(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MeteorSpectra> spectraPage = spectraRepository.findAllByOrderByUploadTimeDesc(pageable);
        return spectraPage.map(this::convertToResponse);
    }
    
    public Page<SpectraResponse> searchSpectra(SearchRequest request) {
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize());
        Page<MeteorSpectra> spectraPage = spectraRepository.searchSpectra(
                request.getElement(),
                request.getMinVelocity(),
                request.getMaxVelocity(),
                request.getUploaderName(),
                pageable);
        return spectraPage.map(this::convertToResponse);
    }
    
    @Cacheable(value = "thumbnails", key = #spectraId)
    public byte[] getThumbnail(Long spectraId) throws IOException {
        MeteorSpectra spectra = spectraRepository.findById(spectraId)
                .orElseThrow(() -> new RuntimeException("Spectra not found"));
        
        if (spectra.getThumbnailPath() != null) {
            Path path = Paths.get(spectra.getThumbnailPath());
            if (Files.exists(path)) {
                return Files.readAllBytes(path);
            }
        }
        
        Path imagePath = Paths.get(spectra.getFilePath());
        if (Files.exists(imagePath)) {
            Path thumbnailPath = Paths.get(uploadPath, "thumb_" + spectra.getStoredFilename());
            createThumbnail(imagePath.toFile(), thumbnailPath.toFile());
            spectra.setThumbnailPath(thumbnailPath.toString());
            spectraRepository.save(spectra);
            return Files.readAllBytes(thumbnailPath);
        }
        
        return null;
    }
    
    public byte[] getOriginalImage(Long spectraId) throws IOException {
        MeteorSpectra spectra = spectraRepository.findById(spectraId)
                .orElseThrow(() -> new RuntimeException("Spectra not found"));
        
        Path path = Paths.get(spectra.getFilePath());
        if (Files.exists(path)) {
            return Files.readAllBytes(path);
        }
        return null;
    }
    
    @Transactional
    public void deleteSpectra(Long spectraId) {
        MeteorSpectra spectra = spectraRepository.findById(spectraId)
                .orElseThrow(() -> new RuntimeException("Spectra not found"));
        
        try {
            if (spectra.getFilePath() != null) {
                Files.deleteIfExists(Paths.get(spectra.getFilePath()));
            }
            if (spectra.getThumbnailPath() != null) {
                Files.deleteIfExists(Paths.get(spectra.getThumbnailPath()));
            }
        } catch (IOException e) {
        }
        
        spectraRepository.delete(spectra);
    }
    
    private void createThumbnail(File original, File thumbnail) throws IOException {
        Thumbnails.of(original)
                .size(thumbnailWidth, thumbnailHeight)
                .keepAspectRatio(true)
                .outputFormat("jpg")
                .toFile(thumbnail);
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }
    
    private SpectraResponse convertToResponse(MeteorSpectra spectra) {
        SpectraResponse response = new SpectraResponse();
        response.setId(spectra.getId());
        response.setOriginalFilename(spectra.getOriginalFilename());
        response.setThumbnailUrl("/api/spectra/" + spectra.getId() + "/thumbnail");
        response.setMinWavelength(spectra.getMinWavelength());
        response.setMaxWavelength(spectra.getMaxWavelength());
        response.setVelocity(spectra.getVelocity());
        response.setNotes(spectra.getNotes());
        response.setUploaderName(spectra.getUploaderName());
        response.setUploadTime(spectra.getUploadTime());
        response.setViewCount(spectra.getViewCount());
        
        List<String> elements = emissionLineRepository.findByMeteorSpectraId(spectra.getId())
                .stream()
                .map(EmissionLine::getElement)
                .distinct()
                .collect(Collectors.toList());
        response.setDetectedElements(elements);
        
        return response;
    }
    
    private SpectraDetailResponse convertToDetailResponse(MeteorSpectra spectra,
                                                          List<SpectrumDataPoint> dataPoints,
                                                          List<EmissionLine> emissionLines) {
        SpectraDetailResponse response = new SpectraDetailResponse();
        response.setId(spectra.getId());
        response.setOriginalFilename(spectra.getOriginalFilename());
        response.setImageUrl("/api/spectra/" + spectra.getId() + "/image");
        response.setThumbnailUrl("/api/spectra/" + spectra.getId() + "/thumbnail");
        response.setMinWavelength(spectra.getMinWavelength());
        response.setMaxWavelength(spectra.getMaxWavelength());
        response.setStartPixelX(spectra.getStartPixelX());
        response.setStartPixelY(spectra.getStartPixelY());
        response.setEndPixelX(spectra.getEndPixelX());
        response.setEndPixelY(spectra.getEndPixelY());
        response.setVelocity(spectra.getVelocity());
        response.setNotes(spectra.getNotes());
        response.setUploaderName(spectra.getUploaderName());
        response.setUploadTime(spectra.getUploadTime() != null ? 
                spectra.getUploadTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        response.setViewCount(spectra.getViewCount());
        
        List<EmissionLineResponse> lineResponses = emissionLines.stream()
                .map(this::convertEmissionLineToResponse)
                .collect(Collectors.toList());
        response.setEmissionLines(lineResponses);
        
        List<SpectrumDataPointResponse> pointResponses = dataPoints.stream()
                .map(this::convertDataPointToResponse)
                .collect(Collectors.toList());
        response.setSpectrumData(pointResponses);
        
        return response;
    }
    
    private EmissionLineResponse convertEmissionLineToResponse(EmissionLine line) {
        EmissionLineResponse response = new EmissionLineResponse();
        response.setId(line.getId());
        response.setElement(line.getElement());
        response.setWavelength(line.getWavelength());
        response.setIntensity(line.getIntensity());
        response.setIsAutoDetected(line.getIsAutoDetected());
        response.setNotes(line.getNotes());
        return response;
    }
    
    private SpectrumDataPointResponse convertDataPointToResponse(SpectrumDataPoint point) {
        SpectrumDataPointResponse response = new SpectrumDataPointResponse();
        response.setWavelength(point.getWavelength());
        response.setIntensity(point.getIntensity());
        response.setPixelIndex(point.getPixelIndex());
        return response;
    }
}
