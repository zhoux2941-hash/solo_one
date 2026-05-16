package com.cinema.entity;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "movies")
public class Movie {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    private String poster;
    
    private String director;
    
    private Integer duration;
    
    private Double price;
    
    private String description;
}