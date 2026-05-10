package com.woodjoin.service;

import com.woodjoin.dto.JoinParamsDTO;
import com.woodjoin.enums.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StlExportService {

    private final JoinCalculationService joinCalculationService;

    public byte[] exportToStl(JoinParamsDTO params) {
        log.info("开始导出STL: {}", params.getJoinType());
        
        Map<String, Object> calculation = joinCalculationService.calculateJoin(params);
        List<Triangle> triangles = new ArrayList<>();
        
        double w = params.getWoodLength();
        double h = params.getWoodWidth();
        double d = params.getWoodHeight();
        
        addBox(triangles, 0, 0, 0, w, h, d);
        
        JoinType type = params.getJoinType();
        
        switch (type) {
            case DOVETAIL -> addDovetailFeatures(triangles, params, calculation);
            case STRAIGHT -> addStraightFeatures(triangles, params, calculation);
            case CLAMP -> addClampFeatures(triangles, params, calculation);
            case BOX -> addBoxFeatures(triangles, params, calculation);
            case LAP -> addLapFeatures(triangles, params, calculation);
        }
        
        return writeBinaryStl(triangles);
    }

    private void addDovetailFeatures(List<Triangle> triangles, JoinParamsDTO params, Map<String, Object> calculation) {
        @SuppressWarnings("unchecked")
        List<Map<String, Double>> tails = (List<Map<String, Double>>) calculation.get("tails");
        double woodLength = params.getWoodLength();
        double margin = params.getMargin();
        
        for (Map<String, Double> tail : tails) {
            double tailX = tail.get("x");
            double topWidth = tail.get("width");
            double height = tail.get("height");
            double length = tail.get("length");
            
            Double offsetObj = tail.get("offset");
            double offset = (offsetObj != null) ? offsetObj : 0;
            
            double maxSafeOffset = topWidth / 2.0 - 0.5;
            double safeOffset = Math.min(offset, maxSafeOffset);
            double bottomWidth = topWidth + 2 * safeOffset;
            
            if (safeOffset <= 0 || bottomWidth <= topWidth + 0.1) {
                addBox(triangles, woodLength, tailX, margin, length, topWidth, height);
                continue;
            }
            
            addDovetailTail(triangles, woodLength, tailX, margin, length, topWidth, bottomWidth, height);
        }
    }
    
    private void addDovetailTail(List<Triangle> triangles, double baseX, double baseY, double baseZ,
                                  double length, double topWidth, double bottomWidth, double height) {
        double halfTop = topWidth / 2.0;
        double halfBottom = bottomWidth / 2.0;
        
        Vec3d b0 = new Vec3d(baseX, baseY - halfBottom, baseZ);
        Vec3d b1 = new Vec3d(baseX, baseY + halfBottom, baseZ);
        Vec3d b2 = new Vec3d(baseX, baseY + halfTop, baseZ + height);
        Vec3d b3 = new Vec3d(baseX, baseY - halfTop, baseZ + height);
        
        Vec3d f0 = new Vec3d(baseX + length, baseY - halfBottom, baseZ);
        Vec3d f1 = new Vec3d(baseX + length, baseY + halfBottom, baseZ);
        Vec3d f2 = new Vec3d(baseX + length, baseY + halfTop, baseZ + height);
        Vec3d f3 = new Vec3d(baseX + length, baseY - halfTop, baseZ + height);
        
        triangles.add(new Triangle(b0, b1, b2));
        triangles.add(new Triangle(b0, b2, b3));
        
        triangles.add(new Triangle(f3, f2, f1));
        triangles.add(new Triangle(f3, f1, f0));
        
        triangles.add(new Triangle(b0, f0, f1));
        triangles.add(new Triangle(b0, f1, b1));
        
        triangles.add(new Triangle(b1, f1, f2));
        triangles.add(new Triangle(b1, f2, b2));
        
        triangles.add(new Triangle(b2, f2, f3));
        triangles.add(new Triangle(b2, f3, b3));
        
        triangles.add(new Triangle(b3, f3, f0));
        triangles.add(new Triangle(b3, f0, b0));
        
        triangles.add(new Triangle(b0, b3, f3));
        triangles.add(new Triangle(b0, f3, f0));
        
        triangles.add(new Triangle(b1, f1, f2));
        triangles.add(new Triangle(b1, f2, b2));
    }

    private void addStraightFeatures(List<Triangle> triangles, JoinParamsDTO params, Map<String, Object> calculation) {
        @SuppressWarnings("unchecked")
        Map<String, Double> tenon = (Map<String, Double>) calculation.get("tenon");
        double x = params.getWoodLength();
        double y = tenon.get("x");
        double z = tenon.get("z");
        double length = tenon.get("length");
        double width = tenon.get("width");
        double height = tenon.get("height");
        
        addBox(triangles, x, y, z, length, width, height);
    }

    private void addClampFeatures(List<Triangle> triangles, JoinParamsDTO params, Map<String, Object> calculation) {
        @SuppressWarnings("unchecked")
        Map<String, Double> tenon = (Map<String, Double>) calculation.get("tenon");
        @SuppressWarnings("unchecked")
        Map<String, Double> shoulder = (Map<String, Double>) calculation.get("shoulder");
        
        double x = params.getWoodLength();
        double y = tenon.get("x");
        double z = tenon.get("z");
        double length = tenon.get("length");
        double width = tenon.get("width");
        double height = tenon.get("height");
        
        addBox(triangles, x, y, z, length, width, height);
        
        double sWidth = shoulder.get("width");
        double sHeight = shoulder.get("height");
        addBox(triangles, x + length * 0.3, y - sWidth * 0.1, z, length * 0.5, sWidth, sHeight);
    }

    private void addBoxFeatures(List<Triangle> triangles, JoinParamsDTO params, Map<String, Object> calculation) {
        @SuppressWarnings("unchecked")
        List<Map<String, Double>> fingers = (List<Map<String, Double>>) calculation.get("fingers");
        
        for (Map<String, Double> finger : fingers) {
            double x = params.getWoodLength();
            double y = finger.get("x");
            double z = params.getMargin();
            double length = finger.get("length");
            double width = finger.get("width");
            double height = finger.get("height");
            
            addBox(triangles, x, y, z, length, width, height);
        }
    }

    private void addLapFeatures(List<Triangle> triangles, JoinParamsDTO params, Map<String, Object> calculation) {
        @SuppressWarnings("unchecked")
        Map<String, Double> lap = (Map<String, Double>) calculation.get("lap");
        double x = params.getWoodLength();
        double y = lap.get("x");
        double z = lap.get("z");
        double length = lap.get("length");
        double width = lap.get("width");
        double height = lap.get("height");
        
        addBox(triangles, x, y, z, length, width, height);
    }

    private void addBox(List<Triangle> triangles, double x, double y, double z, 
                        double l, double w, double h) {
        Vec3d v0 = new Vec3d(x, y, z);
        Vec3d v1 = new Vec3d(x + l, y, z);
        Vec3d v2 = new Vec3d(x + l, y + w, z);
        Vec3d v3 = new Vec3d(x, y + w, z);
        Vec3d v4 = new Vec3d(x, y, z + h);
        Vec3d v5 = new Vec3d(x + l, y, z + h);
        Vec3d v6 = new Vec3d(x + l, y + w, z + h);
        Vec3d v7 = new Vec3d(x, y + w, z + h);

        triangles.add(new Triangle(v0, v1, v2));
        triangles.add(new Triangle(v0, v2, v3));
        triangles.add(new Triangle(v4, v6, v5));
        triangles.add(new Triangle(v4, v7, v6));
        triangles.add(new Triangle(v0, v4, v5));
        triangles.add(new Triangle(v0, v5, v1));
        triangles.add(new Triangle(v1, v5, v6));
        triangles.add(new Triangle(v1, v6, v2));
        triangles.add(new Triangle(v2, v6, v7));
        triangles.add(new Triangle(v2, v7, v3));
        triangles.add(new Triangle(v3, v7, v4));
        triangles.add(new Triangle(v3, v4, v0));
    }

    private byte[] writeBinaryStl(List<Triangle> triangles) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] header = new byte[80];
            String headerText = "WoodJoin STL Export";
            byte[] textBytes = headerText.getBytes();
            System.arraycopy(textBytes, 0, header, 0, textBytes.length);
            bos.write(header);

            ByteBuffer countBuffer = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN);
            countBuffer.putInt(triangles.size());
            bos.write(countBuffer.array());

            for (Triangle t : triangles) {
                Vec3d normal = calculateNormal(t.v1, t.v2, t.v3);
                writeVec3d(bos, normal);
                writeVec3d(bos, t.v1);
                writeVec3d(bos, t.v2);
                writeVec3d(bos, t.v3);
                bos.write(new byte[]{0, 0});
            }

            log.info("STL导出完成，共 {} 个三角形", triangles.size());
            return bos.toByteArray();
        } catch (IOException e) {
            log.error("STL导出失败", e);
            throw new RuntimeException("STL导出失败", e);
        }
    }

    private void writeVec3d(ByteArrayOutputStream bos, Vec3d v) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(12).order(ByteOrder.LITTLE_ENDIAN);
        buffer.putFloat((float) v.x);
        buffer.putFloat((float) v.y);
        buffer.putFloat((float) v.z);
        bos.write(buffer.array());
    }

    private Vec3d calculateNormal(Vec3d v1, Vec3d v2, Vec3d v3) {
        Vec3d u = new Vec3d(v2.x - v1.x, v2.y - v1.y, v2.z - v1.z);
        Vec3d w = new Vec3d(v3.x - v1.x, v3.y - v1.y, v3.z - v1.z);
        
        double nx = u.y * w.z - u.z * w.y;
        double ny = u.z * w.x - u.x * w.z;
        double nz = u.x * w.y - u.y * w.x;
        
        double length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (length > 0) {
            return new Vec3d(nx / length, ny / length, nz / length);
        }
        return new Vec3d(0, 0, 1);
    }

    private static class Vec3d {
        double x, y, z;
        Vec3d(double x, double y, double z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    private static class Triangle {
        Vec3d v1, v2, v3;
        Triangle(Vec3d v1, Vec3d v2, Vec3d v3) {
            this.v1 = v1;
            this.v2 = v2;
            this.v3 = v3;
        }
    }
}