package com.cinema.config;

import com.cinema.entity.*;
import com.cinema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private MovieRepository movieRepository;
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private SeatRepository seatRepository;
    
    @Autowired
    private SnackRepository snackRepository;
    
    @Override
    public void run(String... args) {
        if (movieRepository.count() == 0) {
            initMovies();
            initSnacks();
        }
    }
    
    private void initMovies() {
        Movie m1 = createMovie("流浪地球3", "🌍", "郭帆", 173, 50.0);
        Movie m2 = createMovie("哪吒之魔童闹海", "🐲", "饺子", 110, 45.0);
        Movie m3 = createMovie("复仇者联盟5", "🦸", "漫威", 150, 55.0);
        Movie m4 = createMovie("速度与激情11", "🚗", "林诣彬", 140, 50.0);
        Movie m5 = createMovie("阿凡达3", "🎬", "卡梅隆", 180, 60.0);
        Movie m6 = createMovie("唐人街探案4", "🔍", "陈思诚", 130, 45.0);
        
        initSchedulesAndSeats(m1);
        initSchedulesAndSeats(m2);
        initSchedulesAndSeats(m3);
        initSchedulesAndSeats(m4);
        initSchedulesAndSeats(m5);
        initSchedulesAndSeats(m6);
    }
    
    private Movie createMovie(String title, String poster, String director, int duration, double price) {
        Movie movie = new Movie();
        movie.setTitle(title);
        movie.setPoster(poster);
        movie.setDirector(director);
        movie.setDuration(duration);
        movie.setPrice(price);
        return movieRepository.save(movie);
    }
    
    private void initSchedulesAndSeats(Movie movie) {
        String[] halls = {"1号厅", "2号厅", "3号厅", "IMAX厅"};
        LocalDateTime now = LocalDateTime.now();
        
        for (int day = 0; day < 3; day++) {
            for (int timeIdx = 0; timeIdx < 3; timeIdx++) {
                LocalDateTime showTime = now.plusDays(day)
                    .withHour(10 + timeIdx * 4)
                    .withMinute(0)
                    .withSecond(0);
                
                Schedule schedule = new Schedule();
                schedule.setMovie(movie);
                schedule.setShowTime(showTime);
                schedule.setHall(halls[timeIdx % halls.length]);
                schedule.setPrice(movie.getPrice());
                schedule.setTotalSeats(96);
                schedule = scheduleRepository.save(schedule);
                
                initSeats(schedule);
            }
        }
    }
    
    private void initSeats(Schedule schedule) {
        String[] rows = {"A", "B", "C", "D", "E", "F", "G", "H"};
        int cols = 12;
        
        for (String row : rows) {
            for (int col = 1; col <= cols; col++) {
                Seat seat = new Seat();
                seat.setSchedule(schedule);
                seat.setRowCode(row);
                seat.setColNum(col);
                seat.setStatus(Math.random() < 0.3 ? Seat.SeatStatus.OCCUPIED : Seat.SeatStatus.AVAILABLE);
                seatRepository.save(seat);
            }
        }
    }
    
    private void initSnacks() {
        snackRepository.saveAll(Arrays.asList(
            createSnack("大份爆米花", "🍿", 500),
            createSnack("中份爆米花", "🍿", 300),
            createSnack("大杯可乐", "🥤", 200),
            createSnack("中杯可乐", "🥤", 150),
            createSnack("爆米花+可乐套餐", "🍿🥤", 600),
            createSnack("热狗", "🌭", 250)
        ));
    }
    
    private Snack createSnack(String name, String icon, int points) {
        Snack snack = new Snack();
        snack.setName(name);
        snack.setIcon(icon);
        snack.setPoints(points);
        return snack;
    }
}