package com.example.chemical.controller;

import com.example.chemical.dto.Result;
import com.example.chemical.entity.Chemical;
import com.example.chemical.entity.User;
import com.example.chemical.service.ChemicalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.List;

@RestController
@RequestMapping("/api/chemicals")
public class ChemicalController {

    @Autowired
    private ChemicalService chemicalService;

    @GetMapping
    public Result<List<Chemical>> getAllChemicals(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        List<Chemical> chemicals = chemicalService.getAllChemicals();
        return Result.success(chemicals);
    }

    @GetMapping("/{id}")
    public Result<Chemical> getChemicalById(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        return chemicalService.getChemicalById(id)
                .map(Result::success)
                .orElse(Result.error("Chemical not found"));
    }

    @PostMapping
    public Result<Chemical> createChemical(@RequestBody Chemical chemical, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.DIRECTOR) {
            return Result.error(403, "Only directors can add chemicals");
        }
        Chemical created = chemicalService.createChemical(chemical);
        return Result.success(created);
    }

    @PutMapping("/{id}")
    public Result<Chemical> updateChemical(@PathVariable Long id, @RequestBody Chemical chemical, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.DIRECTOR) {
            return Result.error(403, "Only directors can update chemicals");
        }
        Chemical updated = chemicalService.updateChemical(id, chemical);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Chemical not found");
    }
}
