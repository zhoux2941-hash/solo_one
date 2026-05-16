package com.cinema.service;

import com.cinema.entity.Member;
import com.cinema.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MemberService {
    
    @Autowired
    private MemberRepository memberRepository;
    
    public Member getMemberByPhone(String phone) {
        return memberRepository.findByPhone(phone).orElse(null);
    }
    
    public Member getMemberById(Long id) {
        return memberRepository.findById(id).orElse(null);
    }
    
    public Member registerOrLogin(String phone) {
        Member member = memberRepository.findByPhone(phone).orElse(null);
        if (member == null) {
            member = new Member();
            member.setPhone(phone);
            member.setPoints(0);
            member = memberRepository.save(member);
        }
        return member;
    }
    
    public Member addPoints(Long memberId, int points) {
        Member member = memberRepository.findById(memberId).orElse(null);
        if (member != null) {
            member.setPoints(member.getPoints() + points);
            return memberRepository.save(member);
        }
        return null;
    }
    
    public boolean deductPoints(Long memberId, int points) {
        Member member = memberRepository.findById(memberId).orElse(null);
        if (member != null && member.getPoints() >= points) {
            member.setPoints(member.getPoints() - points);
            memberRepository.save(member);
            return true;
        }
        return false;
    }
}