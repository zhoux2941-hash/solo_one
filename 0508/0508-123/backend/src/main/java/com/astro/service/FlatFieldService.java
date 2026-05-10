package com.astro.service;

import com.astro.entity.Booking;
import com.astro.entity.ObservationImage;
import com.astro.exception.BookingException;
import com.astro.repository.BookingRepository;
import com.astro.repository.ObservationImageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlatFieldService {

    private final BookingRepository bookingRepository;
    private final ObservationImageRepository observationImageRepository;
    private final AstronomyService astronomyService;
    private final ObjectMapper objectMapper;

    private static final String IMAGE_DIR = "data/images";
    private static final int IMAGE_WIDTH = 512;
    private static final int IMAGE_HEIGHT = 512;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Scheduled(cron = "0 */5 * * * *")
    public void processCompletedBookings() {
        log.info("Checking for completed bookings to generate calibration files...");
        
        LocalDateTime now = LocalDateTime.now();
        List<Booking> completedBookings = bookingRepository.findCompletedBookings(now);

        for (Booking booking : completedBookings) {
            try {
                generateCalibrationFiles(booking);
                booking.setStatus("COMPLETED");
                bookingRepository.save(booking);
                log.info("Generated calibration files for booking: {}", booking.getId());
            } catch (Exception e) {
                log.error("Error generating calibration files for booking {}: {}", 
                        booking.getId(), e.getMessage());
                booking.setStatus("FAILED");
                bookingRepository.save(booking);
            }
        }
    }

    public ObservationImage generateCalibrationFiles(Booking booking) throws IOException {
        Path imageDir = Paths.get(IMAGE_DIR);
        if (!Files.exists(imageDir)) {
            Files.createDirectories(imageDir);
        }

        String dateStr = booking.getStartTime().toLocalDate().format(DATE_FORMATTER);
        String bookingIdStr = String.valueOf(booking.getId());

        LocalDate observationDate = booking.getStartTime().toLocalDate();
        double avgSkyBrightness = astronomyService.calculateSkyBrightness(observationDate);

        String rawPath = String.format("%s/%s_%s_raw.json", IMAGE_DIR, dateStr, bookingIdStr);
        String flatPath = String.format("%s/%s_%s_flat.json", IMAGE_DIR, dateStr, bookingIdStr);
        String calibratedPath = String.format("%s/%s_%s_calibrated.json", IMAGE_DIR, dateStr, bookingIdStr);

        int[][] rawImage = generateRawImage(booking);
        writeImageJson(rawPath, rawImage, "RAW", booking, avgSkyBrightness);

        int[][] flatImage = generateFlatField(avgSkyBrightness);
        writeImageJson(flatPath, flatImage, "FLAT", booking, avgSkyBrightness);

        int[][] calibratedImage = applyFlatFieldCorrection(rawImage, flatImage);
        writeImageJson(calibratedPath, calibratedImage, "CALIBRATED", booking, avgSkyBrightness);

        ObservationImage observationImage = new ObservationImage();
        observationImage.setBooking(booking);
        observationImage.setRawImagePath(rawPath);
        observationImage.setFlatImagePath(flatPath);
        observationImage.setCalibratedImagePath(calibratedPath);
        observationImage.setAvgSkyBrightness(avgSkyBrightness);
        observationImage.setGeneratedAt(LocalDateTime.now());

        return observationImageRepository.save(observationImage);
    }

    private int[][] generateRawImage(Booking booking) {
        int[][] image = new int[IMAGE_HEIGHT][IMAGE_WIDTH];
        Random random = new Random(booking.getId());

        int starCenterX = IMAGE_WIDTH / 2 + random.nextInt(100) - 50;
        int starCenterY = IMAGE_HEIGHT / 2 + random.nextInt(100) - 50;
        double starSigma = 15.0;
        int starAmplitude = 1000 + random.nextInt(500);

        int vignettingCenterX = IMAGE_WIDTH / 2;
        int vignettingCenterY = IMAGE_HEIGHT / 2;
        double vignettingSigma = 300.0;

        for (int y = 0; y < IMAGE_HEIGHT; y++) {
            for (int x = 0; x < IMAGE_WIDTH; x++) {
                double starDistance = Math.sqrt(
                        Math.pow(x - starCenterX, 2) + Math.pow(y - starCenterY, 2));
                double starValue = starAmplitude * 
                        Math.exp(-starDistance * starDistance / (2 * starSigma * starSigma));

                double vignettingDistance = Math.sqrt(
                        Math.pow(x - vignettingCenterX, 2) + 
                        Math.pow(y - vignettingCenterY, 2));
                double vignettingFactor = 0.6 + 0.4 * 
                        Math.exp(-vignettingDistance * vignettingDistance / 
                                (2 * vignettingSigma * vignettingSigma));

                int noise = random.nextInt(50);
                int bias = 100 + random.nextInt(20);

                image[y][x] = (int) (bias + noise + starValue * vignettingFactor);
            }
        }

        return image;
    }

    private int[][] generateFlatField(double avgSkyBrightness) {
        int[][] flat = new int[IMAGE_HEIGHT][IMAGE_WIDTH];
        Random random = new Random();

        int centerX = IMAGE_WIDTH / 2;
        int centerY = IMAGE_HEIGHT / 2;
        double sigma = 300.0;
        double baseValue = avgSkyBrightness * 0.8;
        double peakValue = avgSkyBrightness * 1.0;

        for (int y = 0; y < IMAGE_HEIGHT; y++) {
            for (int x = 0; x < IMAGE_WIDTH; x++) {
                double distance = Math.sqrt(
                        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                double gaussian = Math.exp(-distance * distance / (2 * sigma * sigma));
                double value = baseValue + (peakValue - baseValue) * gaussian;

                int noise = random.nextInt(30);
                flat[y][x] = (int) (value + noise);
            }
        }

        return flat;
    }

    private int[][] applyFlatFieldCorrection(int[][] rawImage, int[][] flatImage) {
        int[][] calibrated = new int[IMAGE_HEIGHT][IMAGE_WIDTH];

        double flatSum = 0;
        int flatCount = 0;
        for (int y = 0; y < IMAGE_HEIGHT; y++) {
            for (int x = 0; x < IMAGE_WIDTH; x++) {
                if (flatImage[y][x] > 0) {
                    flatSum += flatImage[y][x];
                    flatCount++;
                }
            }
        }
        double flatMean = flatSum / flatCount;

        for (int y = 0; y < IMAGE_HEIGHT; y++) {
            for (int x = 0; x < IMAGE_WIDTH; x++) {
                if (flatImage[y][x] > 0) {
                    double normalizedFlat = flatImage[y][x] / flatMean;
                    calibrated[y][x] = (int) (rawImage[y][x] / normalizedFlat);
                } else {
                    calibrated[y][x] = rawImage[y][x];
                }
            }
        }

        return calibrated;
    }

    private void writeImageJson(String filePath, int[][] image, String type, 
                                Booking booking, double skyBrightness) throws IOException {
        ObjectNode root = objectMapper.createObjectNode();
        
        ObjectNode header = root.putObject("header");
        header.put("SIMPLE", true);
        header.put("BITPIX", -32);
        header.put("NAXIS", 2);
        header.put("NAXIS1", IMAGE_WIDTH);
        header.put("NAXIS2", IMAGE_HEIGHT);
        header.put("OBJECT", booking.getTargetName());
        header.put("RA", booking.getRa());
        header.put("DEC", booking.getDec());
        header.put("EXPTIME", booking.getExposureTime());
        header.put("DATE-OBS", booking.getStartTime().toString());
        header.put("IMAGETYP", type);
        header.put("SKYBRIGHT", skyBrightness);
        header.put("TELESCOP", booking.getTelescope() != null ? 
                booking.getTelescope().getName() : "Unknown");
        header.put("INSTRUME", booking.getTelescope() != null ? 
                booking.getTelescope().getCameraModel() : "Unknown");

        ArrayNode dataArray = root.putArray("data");
        for (int[] row : image) {
            ArrayNode rowArray = dataArray.addArray();
            for (int pixel : row) {
                rowArray.add(pixel);
            }
        }

        try (FileWriter writer = new FileWriter(filePath)) {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(writer, root);
        }
    }

    public File getCalibratedImageFile(Long bookingId) {
        ObservationImage observationImage = observationImageRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new BookingException("图像未找到或尚未生成"));
        
        File file = new File(observationImage.getCalibratedImagePath());
        if (!file.exists()) {
            throw new BookingException("校准图像文件不存在");
        }
        
        return file;
    }

    public ObservationImage getObservationImage(Long bookingId) {
        return observationImageRepository.findByBookingId(bookingId)
                .orElse(null);
    }
}
