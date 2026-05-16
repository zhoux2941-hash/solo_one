package com.convenience.cashier.service;

import com.convenience.cashier.entity.Member;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MemberService {
    private Map<String, Member> members = new HashMap<>();

    public MemberService() {
        members.put("13800138000", new Member("13800138000", "张三", 1000));
        members.put("13900139000", new Member("13900139000", "李四", 500));
    }

    public Member getMemberByPhone(String phone) {
        return members.get(phone);
    }

    public void addPoints(String phone, int points) {
        Member member = members.get(phone);
        if (member != null) {
            member.setPoints(member.getPoints() + points);
        }
    }

    public Member registerMember(String phone, String name) {
        if (!members.containsKey(phone)) {
            Member member = new Member(phone, name, 0);
            members.put(phone, member);
            return member;
        }
        return members.get(phone);
    }
}
