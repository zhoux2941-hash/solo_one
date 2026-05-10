package com.astronomy.spectral.service;

import com.astronomy.spectral.model.*;
import org.apache.commons.math3.stat.correlation.PearsonsCorrelation;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SpectrumService {

    private static final double MIN_WAVELENGTH = 380.0;
    private static final double MAX_WAVELENGTH = 780.0;
    private static final int POINTS = 400;
    private static final double BALMER_LIMIT_NM = 364.6;

    private static final Map<String, StarTypeInfo> STAR_TYPES = new HashMap<>();

    static {
        STAR_TYPES.put("O", new StarTypeInfo(30000, 60000, "#0066FF", "蓝白色", 
            "极热恒星(30000-60000K)。特点：He II电离氦线强，巴耳末跳变几乎不可见，氢线较弱。典型恒星：参宿一(Alnitak)", 
            Arrays.asList(
                new SpectralLine("He II", 4686.0, "He++", 0.55),
                new SpectralLine("He II", 5411.0, "He++", 0.35),
                new SpectralLine("Hδ", 4102.0, "H", 0.2),
                new SpectralLine("Hγ", 4340.0, "H", 0.22),
                new SpectralLine("Hβ", 4861.0, "H", 0.25),
                new SpectralLine("Hα", 6563.0, "H", 0.2)
        )));
        
        STAR_TYPES.put("B", new StarTypeInfo(10000, 30000, "#87CEFA", "蓝白色", 
            "热恒星(10000-30000K)。特点：中性氦He I线强，氢巴耳末线增强但未达最强，巴耳末跳变开始明显。典型恒星：参宿七(Rigel)", 
            Arrays.asList(
                new SpectralLine("He I", 4026.0, "He", 0.35),
                new SpectralLine("He I", 4121.0, "He", 0.28),
                new SpectralLine("He I", 4388.0, "He", 0.4),
                new SpectralLine("He I", 4471.0, "He", 0.45),
                new SpectralLine("He I", 5876.0, "He", 0.38),
                new SpectralLine("Hδ", 4102.0, "H", 0.4),
                new SpectralLine("Hγ", 4340.0, "H", 0.45),
                new SpectralLine("Hβ", 4861.0, "H", 0.5),
                new SpectralLine("Hα", 6563.0, "H", 0.42)
        )));
        
        STAR_TYPES.put("A", new StarTypeInfo(7500, 10000, "#FFFFFF", "白色", 
            "白色恒星(7500-10000K)。**氢巴耳末线最强**是A型星的标志！He I线消失，金属线(Ca II)开始出现，巴耳末跳变显著。典型恒星：织女星(Vega)、天狼星A", 
            Arrays.asList(
                new SpectralLine("Hδ", 4102.0, "H", 0.75),
                new SpectralLine("Hγ", 4340.0, "H", 0.82),
                new SpectralLine("Hβ", 4861.0, "H", 0.88),
                new SpectralLine("Hα", 6563.0, "H", 0.78),
                new SpectralLine("Hε", 3970.0, "H", 0.7),
                new SpectralLine("Ca II K", 3934.0, "Ca", 0.18),
                new SpectralLine("Ca II H", 3968.0, "Ca", 0.15)
        )));
        
        STAR_TYPES.put("F", new StarTypeInfo(6000, 7500, "#FFFFE0", "黄白色", 
            "黄白色恒星(6000-7500K)。特点：氢线减弱，金属线(Ca II)明显增强，G带(CH)开始出现，巴耳末跳变减弱。典型恒星：南河三(Procyon)", 
            Arrays.asList(
                new SpectralLine("Hδ", 4102.0, "H", 0.4),
                new SpectralLine("Hγ", 4340.0, "H", 0.45),
                new SpectralLine("Hβ", 4861.0, "H", 0.5),
                new SpectralLine("Hα", 6563.0, "H", 0.42),
                new SpectralLine("Ca II K", 3934.0, "Ca", 0.45),
                new SpectralLine("Ca II H", 3968.0, "Ca", 0.4),
                new SpectralLine("G band", 4300.0, "CH", 0.25),
                new SpectralLine("Fe I", 4383.0, "Fe", 0.18)
        )));
        
        STAR_TYPES.put("G", new StarTypeInfo(5000, 6000, "#FFD700", "黄色", 
            "黄色恒星(5000-6000K)。特点：氢线较弱，Ca II线强，G带显著，大量中性金属线。我们的太阳就是G2型！典型恒星：太阳、半人马座α星", 
            Arrays.asList(
                new SpectralLine("Hδ", 4102.0, "H", 0.2),
                new SpectralLine("Hγ", 4340.0, "H", 0.25),
                new SpectralLine("Hβ", 4861.0, "H", 0.3),
                new SpectralLine("Hα", 6563.0, "H", 0.28),
                new SpectralLine("Ca II K", 3934.0, "Ca", 0.6),
                new SpectralLine("Ca II H", 3968.0, "Ca", 0.55),
                new SpectralLine("G band", 4300.0, "CH", 0.48),
                new SpectralLine("Na I D", 5890.0, "Na", 0.32),
                new SpectralLine("Fe I", 4383.0, "Fe", 0.3),
                new SpectralLine("Mg I", 5167.0, "Mg", 0.25)
        )));
        
        STAR_TYPES.put("K", new StarTypeInfo(3500, 5000, "#FFA500", "橙黄色", 
            "橙黄色恒星(3500-5000K)。特点：氢线极弱，分子带(TiO)开始出现，金属线非常强。典型恒星：大角星(Arcturus)、毕宿五(Aldebaran)", 
            Arrays.asList(
                new SpectralLine("Hα", 6563.0, "H", 0.12),
                new SpectralLine("Ca II K", 3934.0, "Ca", 0.7),
                new SpectralLine("Ca II H", 3968.0, "Ca", 0.65),
                new SpectralLine("G band", 4300.0, "CH", 0.65),
                new SpectralLine("Na I D", 5890.0, "Na", 0.5),
                new SpectralLine("TiO", 6700.0, "TiO", 0.25),
                new SpectralLine("Fe I", 4383.0, "Fe", 0.45),
                new SpectralLine("Ca I", 4227.0, "Ca", 0.4)
        )));
        
        STAR_TYPES.put("M", new StarTypeInfo(2400, 3500, "#FF4500", "红色", 
            "红色低温恒星(2400-3500K)。特点：分子带(TiO、VO、H2O)主导光谱，金属线强，氢线几乎不可见。典型恒星：参宿四(Betelgeuse)、比邻星", 
            Arrays.asList(
                new SpectralLine("Ca II K", 3934.0, "Ca", 0.5),
                new SpectralLine("TiO", 4760.0, "TiO", 0.55),
                new SpectralLine("TiO", 4950.0, "TiO", 0.6),
                new SpectralLine("TiO", 6150.0, "TiO", 0.7),
                new SpectralLine("TiO", 6700.0, "TiO", 0.8),
                new SpectralLine("VO", 5300.0, "VO", 0.4),
                new SpectralLine("VO", 7400.0, "VO", 0.55),
                new SpectralLine("Na I D", 5890.0, "Na", 0.55),
                new SpectralLine("Ca I", 4227.0, "Ca", 0.5)
        )));
    }

    @Cacheable(value = "spectra", key = "#type + '_' + #temperature")
    public Spectrum generateSpectrum(String type, double temperature) {
        StarTypeInfo info = STAR_TYPES.get(type);
        if (info == null) {
            throw new IllegalArgumentException("未知的恒星类型: " + type);
        }

        List<Double> wavelengths = new ArrayList<>();
        List<Double> intensities = new ArrayList<>();

        double step = (MAX_WAVELENGTH - MIN_WAVELENGTH) / (POINTS - 1);
        for (int i = 0; i < POINTS; i++) {
            wavelengths.add(MIN_WAVELENGTH + i * step);
        }

        List<Double> continuum = calculateLocalContinuum(wavelengths, temperature);
        
        for (int i = 0; i < wavelengths.size(); i++) {
            double wavelength = wavelengths.get(i);
            double intensity = continuum.get(i);
            
            for (SpectralLine line : info.getLines()) {
                double lineWavelengthNm = line.getWavelength() / 10.0;
                double distance = Math.abs(wavelength - lineWavelengthNm);
                
                double maxDistance = calculateLineMaxDistance(temperature, line);
                if (distance < maxDistance) {
                    double sigma = calculateLineWidth(temperature, line);
                    double effectiveDepth = calculateEffectiveDepth(temperature, line);
                    double absorption = effectiveDepth * Math.exp(-(distance * distance) / (2 * sigma * sigma));
                    intensity *= (1 - absorption);
                }
            }
            
            intensities.add(intensity);
        }

        addBalmerJump(intensities, wavelengths, type, temperature);
        addNoise(intensities, type);
        normalizeIntensities(intensities);

        return new Spectrum(type, temperature, wavelengths, intensities, info.getLines());
    }

    private List<Double> calculateLocalContinuum(List<Double> wavelengths, double temperature) {
        List<Double> continuum = new ArrayList<>();
        
        for (Double wavelength : wavelengths) {
            double bb = blackbodyIntensity(wavelength, temperature);
            double reddening = calculateReddeningFactor(wavelength, temperature);
            continuum.add(bb * reddening);
        }
        
        return continuum;
    }

    private double calculateReddeningFactor(double wavelength, double temperature) {
        double referenceWavelength = 550.0;
        double refWavelength = referenceWavelength * 1e-9;
        double currentWavelength = wavelength * 1e-9;
        
        double alpha = 1.0;
        if (temperature < 4000) {
            alpha = 1.3;
        }
        
        return Math.pow(currentWavelength / refWavelength, -alpha);
    }

    private double calculateLineWidth(double temperature, SpectralLine line) {
        double thermalWidth = 0.15 * Math.sqrt(temperature / 5770.0);
        
        double pressureFactor = 1.0;
        if (temperature > 20000) {
            pressureFactor = 1.3;
        } else if (temperature < 4000) {
            pressureFactor = 0.7;
        }
        
        double elementFactor = 1.0;
        if (line.getElement().contains("TiO") || line.getElement().contains("VO")) {
            elementFactor = 3.0;
        } else if (line.getElement().equals("H")) {
            elementFactor = 1.2;
        } else if (line.getElement().contains("He")) {
            elementFactor = 0.9;
        }
        
        return thermalWidth * pressureFactor * elementFactor;
    }

    private double calculateLineMaxDistance(double temperature, SpectralLine line) {
        double baseWidth = 15.0;
        
        if (line.getElement().contains("TiO") || line.getElement().contains("VO")) {
            baseWidth = 40.0;
        } else if (line.getElement().contains("CH") || line.getName().contains("band")) {
            baseWidth = 25.0;
        } else if (line.getElement().equals("H")) {
            baseWidth = 20.0;
        }
        
        if (temperature > 20000) {
            baseWidth *= 1.2;
        }
        
        return baseWidth;
    }

    private double calculateEffectiveDepth(double temperature, SpectralLine line) {
        double baseDepth = line.getDepth();
        
        if (line.getElement().equals("H")) {
            double tempNorm = temperature / 5770.0;
            
            if (temperature >= 7500 && temperature <= 10000) {
                baseDepth *= 1.15;
            } else if (temperature > 10000 && temperature <= 20000) {
                baseDepth *= 0.75;
            } else if (temperature > 20000) {
                baseDepth *= 0.45;
            } else if (temperature < 7500) {
                double decreaseFactor = 1.0 - (7500 - temperature) / 7500 * 0.5;
                baseDepth *= Math.max(0.2, decreaseFactor);
            }
        }
        
        if (line.getElement().contains("Ca")) {
            if (temperature < 7500) {
                baseDepth *= 1.1;
            } else {
                baseDepth *= 0.7;
            }
        }
        
        if (line.getElement().contains("TiO") || line.getElement().contains("VO")) {
            if (temperature < 4000) {
                baseDepth *= 1.3;
            } else {
                baseDepth *= 0.5;
            }
        }
        
        return Math.max(0.05, Math.min(0.95, baseDepth));
    }

    private void addBalmerJump(List<Double> intensities, List<Double> wavelengths, 
                               String type, double temperature) {
        double jumpStrength = 0.0;
        
        switch (type) {
            case "O":
                jumpStrength = 0.02;
                break;
            case "B":
                jumpStrength = 0.08 + (temperature - 10000) / 20000 * 0.05;
                break;
            case "A":
                jumpStrength = 0.25;
                break;
            case "F":
                jumpStrength = 0.18 - (temperature - 6000) / 1500 * 0.1;
                break;
            case "G":
                jumpStrength = 0.08;
                break;
            case "K":
                jumpStrength = 0.04;
                break;
            case "M":
                jumpStrength = 0.01;
                break;
            default:
                jumpStrength = 0.05;
        }
        
        jumpStrength = Math.max(0.0, Math.min(0.35, jumpStrength));
        
        for (int i = 0; i < wavelengths.size(); i++) {
            double wl = wavelengths.get(i);
            if (wl < 400) {
                double transitionRegion = 400 - 380;
                double distanceFromLimit = 400 - wl;
                double factor = 1.0 - jumpStrength * (1.0 - distanceFromLimit / transitionRegion);
                intensities.set(i, intensities.get(i) * factor);
            }
        }
    }

    private void addNoise(List<Double> intensities, String type) {
        Random random = new Random(42);
        double noiseLevel;
        
        switch (type) {
            case "O":
                noiseLevel = 0.04;
                break;
            case "B":
                noiseLevel = 0.035;
                break;
            case "A":
                noiseLevel = 0.03;
                break;
            case "F":
                noiseLevel = 0.035;
                break;
            case "G":
                noiseLevel = 0.04;
                break;
            case "K":
                noiseLevel = 0.045;
                break;
            case "M":
                noiseLevel = 0.05;
                break;
            default:
                noiseLevel = 0.04;
        }
        
        for (int i = 0; i < intensities.size(); i++) {
            double noise = (random.nextDouble() - 0.5) * 2 * noiseLevel;
            double newIntensity = intensities.get(i) * (1 + noise);
            intensities.set(i, Math.max(0.0, newIntensity));
        }
    }

    private double blackbodyIntensity(double wavelengthNm, double temperature) {
        double wavelength = wavelengthNm * 1e-9;
        double h = 6.626e-34;
        double c = 3e8;
        double k = 1.38e-23;

        double exponent = (h * c) / (wavelength * k * temperature);
        if (exponent > 700) {
            return 0;
        }
        double denominator = Math.exp(exponent) - 1;
        return (2 * h * c * c) / (Math.pow(wavelength, 5) * denominator);
    }

    private void normalizeIntensities(List<Double> intensities) {
        double max = 0;
        for (Double intensity : intensities) {
            if (intensity > max) {
                max = intensity;
            }
        }
        
        if (max > 0) {
            for (int i = 0; i < intensities.size(); i++) {
                intensities.set(i, intensities.get(i) / max);
            }
        }
    }

    public double calculateCorrelation(List<Double> a, List<Double> b) {
        if (a.size() != b.size()) {
            throw new IllegalArgumentException("光谱长度不一致");
        }

        double[] arrA = a.stream().mapToDouble(Double::doubleValue).toArray();
        double[] arrB = b.stream().mapToDouble(Double::doubleValue).toArray();

        try {
            PearsonsCorrelation corr = new PearsonsCorrelation();
            return corr.correlation(arrA, arrB);
        } catch (Exception e) {
            return 0.0;
        }
    }

    public StarTypeInfo getStarTypeInfo(String type) {
        return STAR_TYPES.get(type);
    }

    public List<String> getAllTypes() {
        return Arrays.asList("O", "B", "A", "F", "G", "K", "M");
    }

    public Spectrum generateRandomTargetSpectrum() {
        List<String> types = getAllTypes();
        String randomType = types.get(new Random().nextInt(types.size()));
        StarTypeInfo info = STAR_TYPES.get(randomType);
        
        double tempRange = info.getMaxTemp() - info.getMinTemp();
        double randomTemp = info.getMinTemp() + Math.random() * tempRange;
        
        return generateSpectrum(randomType, randomTemp);
    }

    public Spectrum generateSdssSample(String type) {
        return generateSpectrum(type, getMidTemperature(type));
    }

    private double getMidTemperature(String type) {
        StarTypeInfo info = STAR_TYPES.get(type);
        return (info.getMinTemp() + info.getMaxTemp()) / 2;
    }
}
