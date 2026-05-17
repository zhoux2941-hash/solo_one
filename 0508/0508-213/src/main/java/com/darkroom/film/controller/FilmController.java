package com.darkroom.film.controller;

import com.darkroom.film.entity.Film;
import com.darkroom.film.service.FilmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/films")
@CrossOrigin(origins = "*")
public class FilmController {
    @Autowired
    private FilmService filmService;

    @GetMapping
    public List<Film> getAllFilms() {
        return filmService.findAll();
    }

    @GetMapping("/page")
    public Page<Film> getFilmsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return filmService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Film> getFilmById(@PathVariable Long id) {
        return filmService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Film> getFilmsByStatus(@PathVariable String status) {
        return filmService.findByStatus(status);
    }

    @PostMapping
    public Film createFilm(@RequestBody Film film) {
        return filmService.save(film);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Film> updateFilm(@PathVariable Long id, @RequestBody Film film) {
        return filmService.findById(id)
                .map(existing -> {
                    film.setId(id);
                    return ResponseEntity.ok(filmService.save(film));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Film> updateStatus(@PathVariable Long id, @RequestParam String status) {
        Film updated = filmService.updateStatus(id, status);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFilm(@PathVariable Long id) {
        return filmService.findById(id)
                .map(film -> {
                    filmService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}