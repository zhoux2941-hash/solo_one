package com.meteor.controller;

import com.meteor.entity.MeteorShower;
import com.meteor.service.MeteorShowerService;
import com.meteor.util.ConstellationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/showers")
@CrossOrigin(origins = "*")
public class MeteorShowerController {

    @Autowired
    private MeteorShowerService showerService;

    @GetMapping
    public ResponseEntity<List<MeteorShower>> getAllShowers() {
        return ResponseEntity.ok(showerService.getAllShowers());
    }

    @GetMapping("/hot")
    public ResponseEntity<List<MeteorShower>> getHotShowers() {
        return ResponseEntity.ok(showerService.getHotShowers());
    }

    @GetMapping("/constellations")
    public ResponseEntity<List<ConstellationMapper.ConstellationOption>> getConstellations() {
        return ResponseEntity.ok(ConstellationMapper.getAllConstellations());
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("showers", showerService.getAllShowers());
        info.put("constellations", ConstellationMapper.getAllConstellations());
        info.put("colors", new String[]{"白", "黄", "蓝", "红"});
        info.put("minBrightness", -2.0);
        info.put("maxBrightness", 4.0);
        return ResponseEntity.ok(info);
    }
}
