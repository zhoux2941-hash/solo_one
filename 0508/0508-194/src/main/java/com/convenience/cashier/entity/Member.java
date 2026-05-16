package com.convenience.cashier.entity;

public class Member {
    private String phone;
    private String name;
    private int points;

    public Member() {}

    public Member(String phone, String name, int points) {
        this.phone = phone;
        this.name = name;
        this.points = points;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
}
