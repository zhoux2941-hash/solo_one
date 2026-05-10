package com.escaperoom.controller;

import com.escaperoom.dto.SceneDTO;
import com.escaperoom.service.ScriptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scenes")
public class SceneController {
    @Autowired
    private ScriptService scriptService;

    @PostMapping
    public SceneDTO addScene(@RequestParam Long scriptId, @RequestBody SceneDTO dto) {
        return scriptService.addScene(scriptId, dto);
    }

    @PutMapping("/{sceneId}")
    public SceneDTO updateScene(@PathVariable Long sceneId, @RequestBody SceneDTO dto) {
        return scriptService.updateScene(sceneId, dto);
    }

    @DeleteMapping("/{sceneId}")
    public void deleteScene(@PathVariable Long sceneId) {
        scriptService.deleteScene(sceneId);
    }
}
