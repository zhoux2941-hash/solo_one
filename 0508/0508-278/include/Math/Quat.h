#pragma once
#include "Vec3.h"
#include "Mat3.h"

class Quat {
public:
    float w, x, y, z;

    Quat() : w(1.0f), x(0.0f), y(0.0f), z(0.0f) {}
    Quat(float w, float x, float y, float z) : w(w), x(x), y(y), z(z) {}

    static Quat fromAxisAngle(const Vec3& axis, float angle) {
        float halfAngle = angle * 0.5f;
        float s = std::sin(halfAngle);
        return Quat(std::cos(halfAngle), axis.x * s, axis.y * s, axis.z * s);
    }

    static Quat fromEuler(float pitch, float yaw, float roll) {
        float cy = std::cos(yaw * 0.5f);
        float sy = std::sin(yaw * 0.5f);
        float cp = std::cos(pitch * 0.5f);
        float sp = std::sin(pitch * 0.5f);
        float cr = std::cos(roll * 0.5f);
        float sr = std::sin(roll * 0.5f);

        return Quat(
            cr * cp * cy + sr * sp * sy,
            sr * cp * cy - cr * sp * sy,
            cr * sp * cy + sr * cp * sy,
            cr * cp * sy - sr * sp * cy
        );
    }

    Quat operator*(const Quat& other) const {
        return Quat(
            w * other.w - x * other.x - y * other.y - z * other.z,
            w * other.x + x * other.w + y * other.z - z * other.y,
            w * other.y - x * other.z + y * other.w + z * other.x,
            w * other.z + x * other.y - y * other.x + z * other.w
        );
    }

    Vec3 rotate(const Vec3& v) const {
        Vec3 qvec(x, y, z);
        Vec3 uv = qvec.cross(v);
        Vec3 uuv = qvec.cross(uv);
        uv *= (2.0f * w);
        uuv *= 2.0f;
        return v + uv + uuv;
    }

    float lengthSquared() const {
        return w * w + x * x + y * y + z * z;
    }

    float length() const {
        return std::sqrt(lengthSquared());
    }

    Quat normalized() const {
        float len = length();
        if (len < 1e-6f) return Quat();
        return Quat(w / len, x / len, y / len, z / len);
    }

    void normalize() {
        float len = length();
        if (len < 1e-6f) return;
        w /= len; x /= len; y /= len; z /= len;
    }

    Quat conjugate() const {
        return Quat(w, -x, -y, -z);
    }

    Quat inverse() const {
        return conjugate() / lengthSquared();
    }

    Quat operator/(float scalar) const {
        return Quat(w / scalar, x / scalar, y / scalar, z / scalar);
    }

    Mat3 toMat3() const {
        float xx = x * x, yy = y * y, zz = z * z;
        float xy = x * y, xz = x * z, yz = y * z;
        float wx = w * x, wy = w * y, wz = w * z;

        return Mat3(
            1.0f - 2.0f * (yy + zz), 2.0f * (xy - wz), 2.0f * (xz + wy),
            2.0f * (xy + wz), 1.0f - 2.0f * (xx + zz), 2.0f * (yz - wx),
            2.0f * (xz - wy), 2.0f * (yz + wx), 1.0f - 2.0f * (xx + yy)
        );
    }

    static Quat slerp(const Quat& a, const Quat& b, float t) {
        float dot = a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z;
        if (dot < 0.0f) {
            Quat bNeg(-b.w, -b.x, -b.y, -b.z);
            return slerp(a, bNeg, t);
        }
        if (dot > 0.9995f) {
            Quat result(a.w + t * (b.w - a.w), a.x + t * (b.x - a.x),
                       a.y + t * (b.y - a.y), a.z + t * (b.z - a.z));
            return result.normalized();
        }
        float theta = std::acos(dot);
        float sinTheta = std::sin(theta);
        float wa = std::sin((1.0f - t) * theta) / sinTheta;
        float wb = std::sin(t * theta) / sinTheta;
        return Quat(wa * a.w + wb * b.w, wa * a.x + wb * b.x,
                   wa * a.y + wb * b.y, wa * a.z + wb * b.z);
    }
};
