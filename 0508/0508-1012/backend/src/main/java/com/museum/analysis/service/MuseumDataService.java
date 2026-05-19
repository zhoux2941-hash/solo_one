package com.museum.analysis.service;

import com.museum.analysis.model.*;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class MuseumDataService {

    private static final int HOT_THRESHOLD = 30;
    private static final int MAX_FLOW_RECORDS = 1440;
    private static final int MAX_STAY_RECORDS = 20000;

    private final PositioningService positioningService;
    private final GazeTrackingService gazeTrackingService;

    private final List<Exhibit> exhibits = new ArrayList<>();
    private final Queue<VisitorFlow> visitorFlows = new ConcurrentLinkedQueue<>();
    private final Queue<StayRecord> stayRecords = new ConcurrentLinkedQueue<>();
    private final Map<String, List<StayRecord>> exhibitStayMap = new ConcurrentHashMap<>();
    private final Map<String, ActiveVisitor> activeVisitors = new ConcurrentHashMap<>();

    private int currentVisitorCount = 0;
    private int visitorIdCounter = 0;
    private final Random random = new Random();
    private final SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm");

    public MuseumDataService(PositioningService positioningService, GazeTrackingService gazeTrackingService) {
        this.positioningService = positioningService;
        this.gazeTrackingService = gazeTrackingService;
    }

    private static class ActiveVisitor {
        String visitorId;
        String trueExhibitId;
        double trueX;
        double trueY;
        long enterTime;
        int sampleCount;

        ActiveVisitor(String visitorId, String trueExhibitId, double trueX, double trueY, long enterTime) {
            this.visitorId = visitorId;
            this.trueExhibitId = trueExhibitId;
            this.trueX = trueX;
            this.trueY = trueY;
            this.enterTime = enterTime;
            this.sampleCount = 0;
        }
    }

    @PostConstruct
    public void init() {
        initExhibits();
        generateHistoricalData();
    }

    private void initExhibits() {
        exhibits.add(new Exhibit("E001", "青铜方鼎", "青铜器", "商代晚期青铜礼器", 15, 15, 1));
        exhibits.add(new Exhibit("E002", "玉璧", "玉器", "新石器时代良渚文化玉璧", 35, 20, 1));
        exhibits.add(new Exhibit("E003", "青瓷莲花尊", "瓷器", "南朝青瓷精品", 55, 15, 1));
        exhibits.add(new Exhibit("E004", "《清明上河图》局部", "书画", "宋代张择端名作", 75, 20, 1));
        exhibits.add(new Exhibit("E005", "唐三彩骆驼", "陶瓷", "唐代三彩釉陶器", 20, 50, 2));
        exhibits.add(new Exhibit("E006", "金缕玉衣", "玉器", "西汉诸侯王陵出土", 45, 55, 2));
        exhibits.add(new Exhibit("E007", "编钟", "乐器", "战国时期青铜编钟", 65, 50, 2));
        exhibits.add(new Exhibit("E008", "兵马俑", "雕塑", "秦始皇陵兵马俑", 85, 55, 2));
        exhibits.add(new Exhibit("E009", "青花缠枝纹瓶", "瓷器", "明代永乐年间青花瓷", 15, 85, 3));
        exhibits.add(new Exhibit("E010", "司母戊鼎仿制品", "青铜器", "商代最大青铜鼎", 40, 80, 3));
        exhibits.add(new Exhibit("E011", "战国竹简", "文献", "出土战国时期古籍", 60, 85, 3));
        exhibits.add(new Exhibit("E012", "鎏金铜佛像", "造像", "唐代佛教造像精品", 80, 80, 3));
    }

    private void generateHistoricalData() {
        long now = System.currentTimeMillis();
        for (int i = MAX_FLOW_RECORDS; i > 0; i--) {
            long timestamp = now - (long) i * 60 * 1000;
            int enter = random.nextInt(15) + 3;
            int leave = random.nextInt(12) + 2;
            currentVisitorCount = Math.max(0, currentVisitorCount + enter - leave);

            String timeStr = timeFormat.format(new Date(timestamp));
            visitorFlows.add(new VisitorFlow(timestamp, timeStr, enter, leave, currentVisitorCount));
        }

        for (int i = 0; i < 3000; i++) {
            String visitorId = "V" + (10000 + i);
            Exhibit trueExhibit = exhibits.get(random.nextInt(exhibits.size()));
            double trueX = trueExhibit.getX() + random.nextGaussian() * 1.5;
            double trueY = trueExhibit.getY() + random.nextGaussian() * 1.5;
            int duration = random.nextInt(120) + 5;

            Map<String, Integer> rssiReadings = positioningService.simulateRssiReadings(trueX, trueY);
            PositioningService.PositionResult posResult = positioningService.calculatePosition(visitorId, rssiReadings);

            List<PositioningService.ExhibitAllocation> allocations =
                    positioningService.allocateToExhibits(posResult.getX(), posResult.getY(), posResult.getAccuracy(), exhibits);

            double avgRssi = rssiReadings.values().stream().mapToInt(Integer::intValue).average().orElse(0);

            int gazeSamples = random.nextInt(8) + 2;
            for (int g = 0; g < gazeSamples; g++) {
                gazeTrackingService.simulateGazeSample(visitorId, trueExhibit, trueX, trueY,
                        now - (long) (random.nextInt(duration * 1000)));
            }

            GazeTrackingService.GazeAnalysisResult gazeResult =
                    gazeTrackingService.analyzeVisitorGaze(visitorId, trueExhibit.getId(), duration);

            for (PositioningService.ExhibitAllocation allocation : allocations) {
                double allocatedDuration = duration * allocation.getWeight();
                double gazeRatio = allocation.getExhibitId().equals(trueExhibit.getId()) ? gazeResult.getGazeRatio() : 0.3;
                double effectiveDuration = allocatedDuration * (0.3 + gazeRatio * 0.7);
                boolean isPassingBy = allocation.getExhibitId().equals(trueExhibit.getId()) ?
                        gazeResult.isPassingBy() : true;

                StayRecord record = new StayRecord(
                        visitorId,
                        allocation.getExhibitId(),
                        now - (long) (random.nextInt(3600 * 8)) * 1000,
                        0,
                        duration,
                        posResult.getX(),
                        posResult.getY(),
                        posResult.getAccuracy(),
                        posResult.getConfidence(),
                        allocatedDuration,
                        (int) avgRssi,
                        gazeResult.getGazeDuration() * allocation.getWeight(),
                        gazeRatio,
                        effectiveDuration,
                        isPassingBy,
                        (int) (gazeSamples * allocation.getWeight())
                );
                stayRecords.add(record);
                exhibitStayMap.computeIfAbsent(allocation.getExhibitId(), k -> Collections.synchronizedList(new ArrayList<>())).add(record);
            }

            positioningService.clearVisitorHistory(visitorId);
            gazeTrackingService.clearVisitorHistory(visitorId);
        }
    }

    public List<Exhibit> getAllExhibits() {
        return exhibits;
    }

    public List<VisitorFlow> getVisitorFlows(int minutes) {
        List<VisitorFlow> result = new ArrayList<>();
        Iterator<VisitorFlow> iterator = visitorFlows.iterator();
        int start = Math.max(0, visitorFlows.size() - minutes);
        int index = 0;
        while (iterator.hasNext()) {
            VisitorFlow flow = iterator.next();
            if (index >= start) {
                result.add(flow);
            }
            index++;
        }
        return result;
    }

    public List<ExhibitHeat> getExhibitHeatRanking() {
        List<ExhibitHeat> ranking = new ArrayList<>();

        for (Exhibit exhibit : exhibits) {
            List<StayRecord> records = exhibitStayMap.getOrDefault(exhibit.getId(), Collections.emptyList());
            if (records.isEmpty()) {
                continue;
            }

            List<StayRecord> validRecords = new ArrayList<>();
            for (StayRecord r : records) {
                if (!r.isPassingBy() || r.getAllocatedDuration() > 10) {
                    validRecords.add(r);
                }
            }

            if (validRecords.isEmpty()) {
                continue;
            }

            double totalEffectiveDuration = validRecords.stream().mapToDouble(StayRecord::getEffectiveDuration).sum();
            double avgEffectiveDuration = validRecords.size() > 0 ? totalEffectiveDuration / validRecords.size() : 0;

            double avgGazeRatio = validRecords.stream().mapToDouble(StayRecord::getGazeRatio).average().orElse(0);

            Set<String> uniqueVisitors = new HashSet<>();
            for (StayRecord r : validRecords) {
                if (r.getAllocatedDuration() > 0.5) {
                    uniqueVisitors.add(r.getVisitorId());
                }
            }

            ExhibitHeat heat = new ExhibitHeat();
            heat.setExhibitId(exhibit.getId());
            heat.setExhibitName(exhibit.getName());
            heat.setVisitorCount(uniqueVisitors.size());
            heat.setAvgStayDuration(Math.round(avgEffectiveDuration * 10) / 10.0);
            heat.setTotalStayDuration((int) Math.round(totalEffectiveDuration));
            heat.setHot(avgEffectiveDuration > HOT_THRESHOLD);
            ranking.add(heat);
        }

        ranking.sort((a, b) -> Double.compare(b.getAvgStayDuration(), a.getAvgStayDuration()));
        for (int i = 0; i < ranking.size(); i++) {
            ranking.get(i).setRank(i + 1);
        }

        return ranking;
    }

    public List<HeatMapPoint> getHeatMapData() {
        List<HeatMapPoint> points = new ArrayList<>();
        List<ExhibitHeat> heatRanking = getExhibitHeatRanking();
        Map<String, ExhibitHeat> heatMap = new HashMap<>();
        for (ExhibitHeat heat : heatRanking) {
            heatMap.put(heat.getExhibitId(), heat);
        }

        double maxValue = 0;
        for (Exhibit exhibit : exhibits) {
            ExhibitHeat heat = heatMap.get(exhibit.getId());
            double value = heat != null ? heat.getAvgStayDuration() : 0;
            maxValue = Math.max(maxValue, value);
        }

        for (Exhibit exhibit : exhibits) {
            ExhibitHeat heat = heatMap.get(exhibit.getId());
            double value = heat != null ? heat.getAvgStayDuration() : 0;
            int normalized = maxValue > 0 ? (int) ((value / maxValue) * 100) : 0;

            points.add(new HeatMapPoint(
                    exhibit.getX(),
                    exhibit.getY(),
                    normalized,
                    exhibit.getId(),
                    exhibit.getName()
            ));
        }

        return points;
    }

    public void simulateInfraredCount() {
        int enter = random.nextInt(8) + 1;
        int leave = random.nextInt(6);
        currentVisitorCount = Math.max(0, currentVisitorCount + enter - leave);

        long timestamp = System.currentTimeMillis();
        String timeStr = timeFormat.format(new Date(timestamp));
        VisitorFlow flow = new VisitorFlow(timestamp, timeStr, enter, leave, currentVisitorCount);
        visitorFlows.add(flow);

        while (visitorFlows.size() > MAX_FLOW_RECORDS) {
            visitorFlows.poll();
        }
    }

    public void simulateWifiProbe() {
        int newVisitors = random.nextInt(4) + 1;
        for (int i = 0; i < newVisitors; i++) {
            if (random.nextDouble() < 0.7 && activeVisitors.size() < 50) {
                String visitorId = "V" + (++visitorIdCounter);
                Exhibit trueExhibit = exhibits.get(random.nextInt(exhibits.size()));
                double trueX = trueExhibit.getX() + random.nextGaussian() * 1.0;
                double trueY = trueExhibit.getY() + random.nextGaussian() * 1.0;
                activeVisitors.put(visitorId, new ActiveVisitor(visitorId, trueExhibit.getId(), trueX, trueY, System.currentTimeMillis()));
            }
        }

        Iterator<Map.Entry<String, ActiveVisitor>> iterator = activeVisitors.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, ActiveVisitor> entry = iterator.next();
            ActiveVisitor visitor = entry.getValue();
            long enterTime = visitor.enterTime;
            int duration = (int) ((System.currentTimeMillis() - enterTime) / 1000);

            visitor.sampleCount++;

            Exhibit trueExhibit = exhibits.stream()
                    .filter(e -> e.getId().equals(visitor.trueExhibitId))
                    .findFirst()
                    .orElse(null);

            if (trueExhibit != null) {
                gazeTrackingService.simulateGazeSample(visitor.visitorId, trueExhibit, visitor.trueX, visitor.trueY, System.currentTimeMillis());
            }

            if (visitor.sampleCount % 3 == 0 || duration > 180) {
                Map<String, Integer> rssiReadings = positioningService.simulateRssiReadings(visitor.trueX, visitor.trueY);
                PositioningService.PositionResult posResult = positioningService.calculatePosition(visitor.visitorId, rssiReadings);

                List<PositioningService.ExhibitAllocation> allocations =
                        positioningService.allocateToExhibits(posResult.getX(), posResult.getY(), posResult.getAccuracy(), exhibits);

                boolean shouldLeave = random.nextDouble() < 0.25 || duration > 180;
                int currentDuration = Math.max(5, duration + random.nextInt(15));
                double avgRssi = rssiReadings.values().stream().mapToInt(Integer::intValue).average().orElse(0);

                GazeTrackingService.GazeAnalysisResult gazeResult =
                        gazeTrackingService.analyzeVisitorGaze(visitor.visitorId, visitor.trueExhibitId, currentDuration);

                for (PositioningService.ExhibitAllocation allocation : allocations) {
                    double allocatedDuration = currentDuration * allocation.getWeight() * (shouldLeave ? 1.0 : 0.33);
                    double gazeRatio = allocation.getExhibitId().equals(visitor.trueExhibitId) ? gazeResult.getGazeRatio() : 0.2;
                    double effectiveDuration = allocatedDuration * (0.3 + gazeRatio * 0.7);
                    boolean isPassingBy = allocation.getExhibitId().equals(visitor.trueExhibitId) ?
                            gazeResult.isPassingBy() : (allocation.getWeight() < 0.3);

                    StayRecord record = new StayRecord(
                            visitor.visitorId,
                            allocation.getExhibitId(),
                            enterTime,
                            System.currentTimeMillis(),
                            currentDuration,
                            posResult.getX(),
                            posResult.getY(),
                            posResult.getAccuracy(),
                            posResult.getConfidence(),
                            allocatedDuration,
                            (int) avgRssi,
                            gazeResult.getGazeDuration() * allocation.getWeight(),
                            gazeRatio,
                            effectiveDuration,
                            isPassingBy,
                            (int) (gazeResult.getGazeSampleCount() * allocation.getWeight())
                    );
                    stayRecords.add(record);
                    exhibitStayMap.computeIfAbsent(allocation.getExhibitId(), k -> Collections.synchronizedList(new ArrayList<>())).add(record);
                }

                while (stayRecords.size() > MAX_STAY_RECORDS) {
                    StayRecord removed = stayRecords.poll();
                    if (removed != null) {
                        List<StayRecord> list = exhibitStayMap.get(removed.getExhibitId());
                        if (list != null) {
                            list.remove(removed);
                        }
                    }
                }

                if (shouldLeave) {
                    positioningService.clearVisitorHistory(visitor.visitorId);
                    gazeTrackingService.clearVisitorHistory(visitor.visitorId);
                    iterator.remove();
                }
            }
        }
    }

    public Map<String, Object> getRealtimeStats() {
        Map<String, Object> stats = new HashMap<>();
        List<ExhibitHeat> ranking = getExhibitHeatRanking();

        double avgConfidence = stayRecords.stream()
                .limit(1000)
                .mapToDouble(StayRecord::getConfidence)
                .average()
                .orElse(0);

        double avgAccuracy = stayRecords.stream()
                .limit(1000)
                .mapToDouble(StayRecord::getPositioningAccuracy)
                .average()
                .orElse(0);

        double avgGazeRatio = stayRecords.stream()
                .limit(1000)
                .mapToDouble(StayRecord::getGazeRatio)
                .average()
                .orElse(0);

        long passingByCount = stayRecords.stream()
                .limit(1000)
                .filter(StayRecord::isPassingBy)
                .count();

        double passingByRate = stayRecords.size() > 0 ? (double) passingByCount / Math.min(1000, stayRecords.size()) : 0;

        Map<String, Object> gazeStats = gazeTrackingService.getGazeStats();

        stats.put("currentVisitorCount", currentVisitorCount);
        stats.put("hotExhibitCount", ranking.stream().filter(ExhibitHeat::isHot).count());
        stats.put("totalStayRecords", stayRecords.size());
        stats.put("activeWifiProbes", activeVisitors.size());
        stats.put("avgPositioningAccuracy", Math.round(avgAccuracy * 100) / 100.0);
        stats.put("avgPositioningConfidence", Math.round(avgConfidence * 100) / 100.0);
        stats.put("avgGazeRatio", Math.round(avgGazeRatio * 100) / 100.0);
        stats.put("passingByRate", Math.round(passingByRate * 100) / 100.0);
        stats.put("filteredPassingByCount", passingByCount);
        stats.put("gazeTracking", gazeStats);
        stats.put("positioningAlgorithm", "Trilateration + Kalman Filter + Gaussian Weighting");
        stats.put("gazeAlgorithm", "Camera-based Gaze Tracking + Effectiveness Calibration");

        return stats;
    }

    public Map<String, Object> getPositioningInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("probes", positioningService.getProbes());
        info.put("minAccuracy", 3.0);
        info.put("maxAccuracy", 5.0);
        info.put("exhibitSpacing", 2.0);
        info.put("exhibitInfluenceRadius", 4.0);
        info.put("allocationMethod", "Gaussian Weighted Probability Distribution");
        return info;
    }

    public Map<String, Object> getGazeInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("cameras", gazeTrackingService.getCameras());
        info.put("stats", gazeTrackingService.getGazeStats());
        return info;
    }
}
