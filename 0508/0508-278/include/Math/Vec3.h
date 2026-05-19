#pragma once
#include <cmath>
#include <iostream>

class Vec3 {
public:
    float x, y, z;

    Vec3() : x(0.0f), y(0.0f), z(0.0f) {}
    Vec3(float x, float y, float z) : x(x), y(y), z(z) {}

    Vec3 operator+(const Vec3& other) const {
        return Vec3(x + other.x, y + other.y, z + other.z);
    }

    Vec3 operator-(const Vec3& other) const {
        return Vec3(x - other.x, y - other.y, z - other.z);
    }

    Vec3 operator*(float scalar) const {
        return Vec3(x * scalar, y * scalar, z * scalar);
    }

    Vec3 operator/(float scalar) const {
        float inv = 1.0f / scalar;
        return Vec3(x * inv, y * inv, z * inv);
    }

    Vec3& operator+=(const Vec3& other) {
        x += other.x; y += other.y; z += other.z;
        return *this;
    }

    Vec3& operator-=(const Vec3& other) {
        x -= other.x; y -= other.y; z -= other.z;
        return *this;
    }

    Vec3& operator*=(float scalar) {
        x *= scalar; y *= scalar; z *= scalar;
        return *this;
    }

    float dot(const Vec3& other) const {
        return x * other.x + y * other.y + z * other.z;
    }

    Vec3 cross(const Vec3& other) const {
        return Vec3(
            y * other.z - z * other.y,
            z * other.x - x * other.z,
            x * other.y - y * other.x
        );
    }

    float lengthSquared() const {
        return x * x + y * y + z * z;
    }

    float length() const {
        return std::sqrt(lengthSquared());
    }

    Vec3 normalized() const {
        float len = length();
        if (len < 1e-6f) return Vec3(0, 0, 0);
        return *this / len;
    }

    void normalize() {
        float len = length();
        if (len < 1e-6f) return;
        *this *= (1.0f / len);
    }

    static Vec3 zero() { return Vec3(0, 0, 0); }
    static Vec3 one() { return Vec3(1, 1, 1); }
    static Vec3 up() { return Vec3(0, 1, 0); }
    static Vec3 right() { return Vec3(1, 0, 0); }
    static Vec3 forward() { return Vec3(0, 0, 1); }
};

inline Vec3 operator*(float scalar, const Vec3& vec) {
    return vec * scalar;
}

inline std::ostream& operator<<(std::ostream& os, const Vec3& v) {
    os << "(" << v.x << ", " << v.y << ", " << v.z << ")";
    return os;
}
