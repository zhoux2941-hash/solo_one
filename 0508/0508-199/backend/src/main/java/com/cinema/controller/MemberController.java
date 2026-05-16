package com.cinema.controller;

import com.cinema.entity.Member;
import com.cinema.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
public class MemberController {
    
    @Autowired
    private MemberService memberService;
    
    @PostMapping("/login")
    public ResponseEntity<Member> login(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        Member member = memberService.registerOrLogin(phone);
        return ResponseEntity.ok(member);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Member> getMemberById(@PathVariable Long id) {
        Member member = memberService.getMemberById(id);
        return member != null ? ResponseEntity.ok(member) : ResponseEntity.notFound().build();
    }
    
    @GetMapping("/phone/{phone}")
    public ResponseEntity<Member> getMemberByPhone(@PathVariable String phone) {
        Member member = memberService.getMemberByPhone(phone);
        return member != null ? ResponseEntity.ok(member) : ResponseEntity.notFound().build();
    }
}