package com.astro.service;

import com.astro.config.AppConfig;
import com.astro.dto.*;
import com.astro.entity.Telescope;
import com.astro.exception.BookingException;
import com.astro.repository.TelescopeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GuideStarService {

    private final TelescopeRepository telescopeRepository;
    private final AstronomyService astronomyService;
    private final AppConfig appConfig;
    private final Random random = new Random();

    private static final List<GuideStarCatalog> CATALOG_STARS = Arrays.asList(
        new GuideStarCatalog("北极星 (Polaris)", 2.5302, 89.2641, 1.98, "小熊座"),
        new GuideStarCatalog("织女星 (Vega)", 18.6156, 38.7837, 0.03, "天琴座"),
        new GuideStarCatalog("天狼星 (Sirius)", 6.7525, -16.7131, -1.46, "大犬座"),
        new GuideStarCatalog("大角星 (Arcturus)", 14.2613, 19.1873, -0.05, "牧夫座"),
        new GuideStarCatalog("五车二 (Capella)", 5.2782, 45.9980, 0.08, "御夫座"),
        new GuideStarCatalog("参宿四 (Betelgeuse)", 5.9195, 7.4071, 0.42, "猎户座"),
        new GuideStarCatalog("南河三 (Procyon)", 7.6550, 5.2250, 0.34, "小犬座"),
        new GuideStarCatalog("河鼓二 (Altair)", 19.8463, 8.8683, 0.77, "天鹰座"),
        new GuideStarCatalog("角宿一 (Spica)", 13.4199, -11.1613, 0.97, "室女座"),
        new GuideStarCatalog("心宿二 (Antares)", 16.4901, -26.4317, 1.09, "天蝎座"),
        new GuideStarCatalog("北河三 (Pollux)", 7.7553, 28.0262, 1.14, "双子座"),
        new GuideStarCatalog("天津四 (Deneb)", 20.6907, 45.2803, 1.25, "天鹅座"),
        new GuideStarCatalog("十字架二 (Acrux)", 12.4432, -63.0991, 0.77, "南十字座"),
        new GuideStarCatalog("猎户座α参宿七", 5.9196, -8.2016, 0.13, "猎户座"),
        new GuideStarCatalog("双子座α北河二", 7.5792, 31.8883, 1.58, "双子座"),
        new GuideStarCatalog("室女座α角宿一", 13.4199, -11.1613, 0.97, "室女座"),
        new GuideStarCatalog("天蝎座α心宿二", 16.4901, -26.4317, 1.09, "天蝎座"),
        new GuideStarCatalog("仙女座α壁宿二", 0.1398, 29.0904, 1.79, "仙女座"),
        new GuideStarCatalog("狮子座α轩辕十四", 10.1395, 11.9672, 1.35, "狮子座"),
        new GuideStarCatalog("天鹰座α河鼓二", 19.8463, 8.8683, 0.77, "天鹰座")
    );

    public List<GuideStarCatalog> getGuideStarCatalog() {
        return new ArrayList<>(CATALOG_STARS);
    }

    public List<GuideStarCatalog> getRecommendedGuideStars(Double targetRa, Double targetDec, LocalDateTime time) {
        List<GuideStarCatalog> recommended = new ArrayList<>();
        
        for (GuideStarCatalog star : CATALOG_STARS) {
            double separation = calculateAngularSeparation(
                targetRa, targetDec, star.getRa(), star.getDec());
            
            double elevation = astronomyService.calculateElevation(
                star.getRa(), star.getDec(), time);
            
            if (elevation > appConfig.getBooking().getHorizonElevation() && 
                separation > 5.0 && separation < 30.0 &&
                star.getMagnitude() < 6.0) {
                recommended.add(star);
            }
        }
        
        recommended.sort((a, b) -> {
            double sepA = calculateAngularSeparation(targetRa, targetDec, a.getRa(), a.getDec());
            double sepB = calculateAngularSeparation(targetRa, targetDec, b.getRa(), b.getDec());
            return Double.compare(sepA, sepB);
        });
        
        return recommended;
    }

    public GuideStarResponse simulateGuiding(GuideStarRequest request) {
        Telescope telescope = telescopeRepository.findById(request.getTelescopeId())
            .orElseThrow(() -> new BookingException("望远镜不存在"));

        double guideStarElevation = astronomyService.calculateElevation(
            request.getGuideStarRa(), request.getGuideStarDec(), request.getObservationTime());

        double targetElevation = astronomyService.calculateElevation(
            request.getTargetRa(), request.getTargetDec(), request.getObservationTime());

        double separation = calculateAngularSeparation(
            request.getGuideStarRa(), request.getGuideStarDec(),
            request.getTargetRa(), request.getTargetDec());

        List<GuideStarDataPoint> errorCurve = generateErrorCurve(
            request, telescope, guideStarElevation);

        GuideStarAnalysis analysis = calculateAnalysis(
            request, guideStarElevation, targetElevation, separation, errorCurve);

        List<CorrectionSuggestion> suggestions = generateSuggestions(
            analysis, telescope, separation);

        GuideStarResponse response = new GuideStarResponse();
        response.setSuccess(true);
        response.setMessage("导星模拟完成");
        response.setAnalysis(analysis);
        response.setErrorCurve(errorCurve);
        response.setSuggestions(suggestions);

        return response;
    }

    private List<GuideStarDataPoint> generateErrorCurve(
            GuideStarRequest request, Telescope telescope, 
            double guideStarElevation) {
        
        List<GuideStarDataPoint> points = new ArrayList<>();
        
        int numPoints = 60;
        long baseTime = System.currentTimeMillis();
        
        double baseError = calculateBaseError(telescope, guideStarElevation);
        double periodicPeriod = 15.0 + random.nextDouble() * 10;
        double periodicAmplitude = baseError * (0.3 + random.nextDouble() * 0.4);
        double driftRate = random.nextGaussian() * baseError * 0.1;
        
        double raDrift = 0;
        double decDrift = 0;
        
        for (int i = 0; i < numPoints; i++) {
            double t = i / (double) numPoints;
            
            double periodicPhase = (i / periodicPeriod) * 2 * Math.PI;
            double periodicRa = Math.sin(periodicPhase) * periodicAmplitude;
            double periodicDec = Math.cos(periodicPhase * 0.7) * periodicAmplitude * 0.8;
            
            double noiseRa = random.nextGaussian() * baseError * 0.5;
            double noiseDec = random.nextGaussian() * baseError * 0.5;
            
            raDrift += driftRate * random.nextGaussian();
            decDrift += driftRate * 0.5 * random.nextGaussian();
            
            double raError = periodicRa + noiseRa + raDrift;
            double decError = periodicDec + noiseDec + decDrift;
            double totalError = Math.sqrt(raError * raError + decError * decError);
            
            GuideStarDataPoint point = new GuideStarDataPoint();
            point.setFrame(i + 1);
            point.setRaError(Math.round(raError * 1000.0) / 1000.0);
            point.setDecError(Math.round(decError * 1000.0) / 1000.0);
            point.setTotalError(Math.round(totalError * 1000.0) / 1000.0);
            point.setTimestamp(baseTime + i * 1000L);
            
            points.add(point);
        }
        
        return points;
    }

    private double calculateBaseError(Telescope telescope, double elevation) {
        double elevationFactor = 1.0 + (90 - elevation) / 90.0 * 0.5;
        
        String mirror = telescope.getPrimaryMirror();
        if (mirror.contains("300mm")) {
            return 0.3 * elevationFactor;
        } else if (mirror.contains("200mm")) {
            return 0.5 * elevationFactor;
        } else {
            return 0.7 * elevationFactor;
        }
    }

    private GuideStarAnalysis calculateAnalysis(
            GuideStarRequest request,
            double guideStarElevation,
            double targetElevation,
            double separation,
            List<GuideStarDataPoint> errorCurve) {
        
        double sumSquared = 0;
        double maxError = 0;
        
        for (GuideStarDataPoint point : errorCurve) {
            sumSquared += point.getTotalError() * point.getTotalError();
            maxError = Math.max(maxError, point.getTotalError());
        }
        
        double rms = Math.sqrt(sumSquared / errorCurve.size());
        
        String quality;
        if (rms < 0.5) {
            quality = "EXCELLENT";
        } else if (rms < 1.0) {
            quality = "GOOD";
        } else if (rms < 2.0) {
            quality = "FAIR";
        } else {
            quality = "POOR";
        }
        
        String guidingMode;
        if (separation < 10.0) {
            guidingMode = "离轴导星 (Off-Axis)";
        } else if (separation < 20.0) {
            guidingMode = "平行导星 (Parallel)";
        } else {
            guidingMode = "独立导星 (Separate)";
        }
        
        GuideStarAnalysis analysis = new GuideStarAnalysis();
        analysis.setGuideStarName(request.getGuideStarName());
        analysis.setGuideStarRa(request.getGuideStarRa());
        analysis.setGuideStarDec(request.getGuideStarDec());
        analysis.setTargetRa(request.getTargetRa());
        analysis.setTargetDec(request.getTargetDec());
        analysis.setSeparation(Math.round(separation * 100.0) / 100.0);
        analysis.setGuideStarElevation(Math.round(guideStarElevation * 100.0) / 100.0);
        analysis.setTargetElevation(Math.round(targetElevation * 100.0) / 100.0);
        analysis.setAvgRmsError(Math.round(rms * 1000.0) / 1000.0);
        analysis.setMaxError(Math.round(maxError * 1000.0) / 1000.0);
        analysis.setQuality(quality);
        analysis.setGuidingMode(guidingMode);
        
        return analysis;
    }

    private List<CorrectionSuggestion> generateSuggestions(
            GuideStarAnalysis analysis, Telescope telescope, double separation) {
        
        List<CorrectionSuggestion> suggestions = new ArrayList<>();
        
        if ("EXCELLENT".equals(analysis.getQuality())) {
            suggestions.add(new CorrectionSuggestion(
                "POSITIVE", "LOW",
                "导星质量优秀",
                "当前导星配置可获得高质量图像，RMS 误差为 " + analysis.getAvgRmsError() + " 角秒"
            ));
        }
        
        if ("POOR".equals(analysis.getQuality())) {
            suggestions.add(new CorrectionSuggestion(
                "WARNING", "HIGH",
                "导星误差过大",
                "RMS 误差超过 2 角秒，建议更换更亮的导星或缩短单张曝光时间"
            ));
        } else if ("FAIR".equals(analysis.getQuality())) {
            suggestions.add(new CorrectionSuggestion(
                "INFO", "MEDIUM",
                "导星质量一般",
                "RMS 误差在 1-2 角秒之间，可考虑使用更亮的导星以获得更好的效果"
            ));
        }
        
        if (analysis.getAvgRmsError() > 0.8) {
            suggestions.add(new CorrectionSuggestion(
                "CORRECTION", "MEDIUM",
                "建议缩短曝光时间",
                "当前导星误差较大，建议将单张曝光时间从 " + telescope.getLimitingMagnitude() + 
                " 对应的曝光时间缩短 20-30%"
            ));
        }
        
        if (separation > 20.0) {
            suggestions.add(new CorrectionSuggestion(
                "WARNING", "MEDIUM",
                "导星距离目标较远",
                "导星与目标的角距离为 " + Math.round(separation * 10) / 10.0 + 
                " 度，可能存在场旋效应，建议选择更近的导星"
            ));
        }
        
        if (analysis.getGuideStarElevation() < 30.0) {
            suggestions.add(new CorrectionSuggestion(
                "WARNING", "HIGH",
                "导星仰角较低",
                "导星仰角仅 " + analysis.getGuideStarElevation() + 
                " 度，大气折射和消光影响较大，建议选择更高仰角的导星"
            ));
        } else if (analysis.getGuideStarElevation() > 60.0) {
            suggestions.add(new CorrectionSuggestion(
                "POSITIVE", "LOW",
                "导星仰角良好",
                "导星仰角为 " + analysis.getGuideStarElevation() + 
                " 度，处于最佳观测区域"
            ));
        }
        
        if (analysis.getMaxError() > analysis.getAvgRmsError() * 3) {
            suggestions.add(new CorrectionSuggestion(
                "CORRECTION", "MEDIUM",
                "存在突发导星误差",
                "模拟中检测到较大的突发误差，建议检查机械平衡和导星摄像头对焦"
            ));
        }
        
        if (suggestions.stream().noneMatch(s -> "POSITIVE".equals(s.getType()))) {
            suggestions.add(new CorrectionSuggestion(
                "POSITIVE", "LOW",
                "导星系统正常工作",
                "自动导星系统运行正常，可开始观测"
            ));
        }
        
        return suggestions;
    }

    private double calculateAngularSeparation(
            double ra1Hours, double dec1Deg, 
            double ra2Hours, double dec2Deg) {
        
        double ra1 = Math.toRadians(ra1Hours * 15.0);
        double dec1 = Math.toRadians(dec1Deg);
        double ra2 = Math.toRadians(ra2Hours * 15.0);
        double dec2 = Math.toRadians(dec2Deg);
        
        double deltaRa = Math.abs(ra1 - ra2);
        if (deltaRa > Math.PI) deltaRa = 2 * Math.PI - deltaRa;
        
        double cosSep = Math.sin(dec1) * Math.sin(dec2) + 
                        Math.cos(dec1) * Math.cos(dec2) * Math.cos(deltaRa);
        
        cosSep = Math.max(-1.0, Math.min(1.0, cosSep));
        
        return Math.toDegrees(Math.acos(cosSep));
    }
}
