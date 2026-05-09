package com.company.seatbooking.service;

import com.company.seatbooking.dto.SeatStatusDTO;
import com.company.seatbooking.entity.Booking;
import com.company.seatbooking.entity.Booking.BookingStatus;
import com.company.seatbooking.entity.Seat;
import com.company.seatbooking.repository.BookingRepository;
import com.company.seatbooking.repository.SeatRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SeatService {
    
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;
    private final SeatStatusCacheService seatStatusCacheService;
    
    public SeatService(SeatRepository seatRepository,
                       BookingRepository bookingRepository,
                       SeatStatusCacheService seatStatusCacheService) {
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
        this.seatStatusCacheService = seatStatusCacheService;
    }
    
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }
    
    public Seat getSeatById(Long seatId) {
        return seatRepository.findById(seatId).orElse(null);
    }
    
    public List<String> getAllAreas() {
        return seatRepository.findAllAreas();
    }
    
    public List<Seat> getSeatsByArea(String area) {
        return seatRepository.findByArea(area);
    }
    
    public List<SeatStatusDTO> getSeatStatusByDateAndArea(String area, LocalDate date) {
        List<Seat> seats;
        if (area == null || area.isEmpty()) {
            seats = seatRepository.findAll();
        } else {
            seats = seatRepository.findByArea(area);
        }
        
        List<Booking> bookings = bookingRepository.findByDateAndStatus(date, BookingStatus.CONFIRMED);
        
        List<SeatStatusDTO> seatStatusList = new ArrayList<>();
        for (Seat seat : seats) {
            List<Booking> seatBookings = bookings.stream()
                .filter(b -> b.getSeatId().equals(seat.getSeatId()))
                .collect(Collectors.toList());
            
            boolean morningBooked = false;
            boolean afternoonBooked = false;
            
            for (Booking booking : seatBookings) {
                if (booking.getTimeSlot() == Booking.TimeSlot.MORNING || 
                    booking.getTimeSlot() == Booking.TimeSlot.FULL_DAY) {
                    morningBooked = true;
                }
                if (booking.getTimeSlot() == Booking.TimeSlot.AFTERNOON || 
                    booking.getTimeSlot() == Booking.TimeSlot.FULL_DAY) {
                    afternoonBooked = true;
                }
            }
            
            seatStatusCacheService.setSeatStatus(seat.getSeatId(), date, "MORNING", morningBooked);
            seatStatusCacheService.setSeatStatus(seat.getSeatId(), date, "AFTERNOON", afternoonBooked);
            
            SeatStatusDTO dto = new SeatStatusDTO(
                seat.getSeatId(),
                seat.getArea(),
                seat.getHasMonitor(),
                seat.getRowNum(),
                seat.getColNum(),
                seat.getDescription(),
                morningBooked ? "BOOKED" : "AVAILABLE",
                afternoonBooked ? "BOOKED" : "AVAILABLE"
            );
            seatStatusList.add(dto);
        }
        
        return seatStatusList;
    }
    
    public Seat createSeat(Seat seat) {
        return seatRepository.save(seat);
    }
    
    public void deleteSeat(Long seatId) {
        seatRepository.deleteById(seatId);
    }
}
