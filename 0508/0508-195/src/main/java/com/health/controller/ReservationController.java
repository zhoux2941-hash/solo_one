package com.health.controller;

import com.health.dto.ReservationRequest;
import com.health.entity.HealthPackage;
import com.health.entity.Reservation;
import com.health.service.HealthPackageService;
import com.health.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private HealthPackageService packageService;

    @GetMapping("/slots")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Map<String, Object> result = new HashMap<>();
        result.put("date", date.toString());
        result.put("available", reservationService.getAvailableSlots(date));
        result.put("total", 50);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody ReservationRequest request) {
        try {
            HealthPackage pkg = packageService.getPackageById(request.getPackageId());
            if (pkg == null) {
                return ResponseEntity.badRequest().body("套餐不存在");
            }

            if (!request.getIdCard().matches("^\\d{17}[\\dXx]$")) {
                return ResponseEntity.badRequest().body("请输入正确的18位身份证号码");
            }

            if (!request.getPhone().matches("^1[3-9]\\d{9}$")) {
                return ResponseEntity.badRequest().body("请输入正确的手机号");
            }

            LocalDate reservationDate = LocalDate.parse(request.getReservationDate());
            LocalDate today = LocalDate.now();
            
            if (reservationDate.equals(today)) {
                String timeStart = request.getTimeSlot().split("-")[0];
                String[] parts = timeStart.split(":");
                int hour = Integer.parseInt(parts[0]);
                int minute = Integer.parseInt(parts[1]);
                
                java.time.LocalTime now = java.time.LocalTime.now();
                if (hour < now.getHour() || (hour == now.getHour() && minute <= now.getMinute())) {
                    return ResponseEntity.badRequest().body("所选时段已过期，请选择其他时段");
                }
            }

            Reservation reservation = new Reservation();
            reservation.setUserName(request.getUserName());
            reservation.setPhone(request.getPhone());
            reservation.setIdCard(request.getIdCard());
            reservation.setPackageId(request.getPackageId());
            reservation.setPackageName(pkg.getName());
            reservation.setReservationDate(reservationDate);
            reservation.setTimeSlot(request.getTimeSlot());

            Reservation saved = reservationService.createReservation(reservation);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/phone/{phone}")
    public ResponseEntity<List<Reservation>> getReservationsByPhone(@PathVariable String phone) {
        return ResponseEntity.ok(reservationService.getReservationsByPhone(phone));
    }

    @GetMapping
    public ResponseEntity<List<Reservation>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getReservationById(@PathVariable Long id) {
        Reservation reservation = reservationService.getReservationById(id);
        if (reservation == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reservation);
    }
}
