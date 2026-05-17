package com.darkroom.film.service;

import com.darkroom.film.entity.Film;
import com.darkroom.film.repository.FilmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FilmService {
    @Autowired
    private FilmRepository filmRepository;

    public List<Film> findAll() {
        return filmRepository.findAll();
    }

    public Page<Film> findAll(Pageable pageable) {
        return filmRepository.findAll(pageable);
    }

    public Optional<Film> findById(Long id) {
        return filmRepository.findById(id);
    }

    public List<Film> findByStatus(String status) {
        return filmRepository.findByStatus(status);
    }

    public Film save(Film film) {
        return filmRepository.save(film);
    }

    public void deleteById(Long id) {
        filmRepository.deleteById(id);
    }

    public Film updateStatus(Long id, String status) {
        Optional<Film> optional = filmRepository.findById(id);
        if (optional.isPresent()) {
            Film film = optional.get();
            film.setStatus(status);
            return filmRepository.save(film);
        }
        return null;
    }
}