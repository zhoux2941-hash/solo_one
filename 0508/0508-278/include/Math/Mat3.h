#pragma once
#include "Vec3.h"

class Mat3 {
public:
    float m[3][3];

    Mat3() {
        m[0][0] = m[0][1] = m[0][2] = 0.0f;
        m[1][0] = m[1][1] = m[1][2] = 0.0f;
        m[2][0] = m[2][1] = m[2][2] = 0.0f;
    }

    Mat3(float m00, float m01, float m02,
         float m10, float m11, float m12,
         float m20, float m21, float m22) {
        m[0][0] = m00; m[0][1] = m01; m[0][2] = m02;
        m[1][0] = m10; m[1][1] = m11; m[1][2] = m12;
        m[2][0] = m20; m[2][1] = m21; m[2][2] = m22;
    }

    static Mat3 identity() {
        return Mat3(1, 0, 0,
                    0, 1, 0,
                    0, 0, 1);
    }

    static Mat3 outerProduct(const Vec3& a, const Vec3& b) {
        return Mat3(
            a.x * b.x, a.x * b.y, a.x * b.z,
            a.y * b.x, a.y * b.y, a.y * b.z,
            a.z * b.x, a.z * b.y, a.z * b.z
        );
    }

    Mat3 operator+(const Mat3& other) const {
        Mat3 result;
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                result.m[i][j] = m[i][j] + other.m[i][j];
        return result;
    }

    Mat3 operator-(const Mat3& other) const {
        Mat3 result;
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                result.m[i][j] = m[i][j] - other.m[i][j];
        return result;
    }

    Mat3 operator*(float scalar) const {
        Mat3 result;
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                result.m[i][j] = m[i][j] * scalar;
        return result;
    }

    Vec3 operator*(const Vec3& v) const {
        return Vec3(
            m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
            m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
            m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z
        );
    }

    Mat3 operator*(const Mat3& other) const {
        Mat3 result;
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                for (int k = 0; k < 3; k++)
                    result.m[i][j] += m[i][k] * other.m[k][j];
        return result;
    }

    float determinant() const {
        return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
             - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
             + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    }

    Mat3 inverse() const {
        float det = determinant();
        if (std::abs(det) < 1e-10f) return identity();
        
        float invDet = 1.0f / det;
        Mat3 result;
        
        result.m[0][0] = (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * invDet;
        result.m[0][1] = (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet;
        result.m[0][2] = (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet;
        
        result.m[1][0] = (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet;
        result.m[1][1] = (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet;
        result.m[1][2] = (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * invDet;
        
        result.m[2][0] = (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * invDet;
        result.m[2][1] = (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * invDet;
        result.m[2][2] = (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * invDet;
        
        return result;
    }

    Mat3 transpose() const {
        return Mat3(
            m[0][0], m[1][0], m[2][0],
            m[0][1], m[1][1], m[2][1],
            m[0][2], m[1][2], m[2][2]
        );
    }

    float trace() const {
        return m[0][0] + m[1][1] + m[2][2];
    }
};

inline Mat3 operator*(float scalar, const Mat3& mat) {
    return mat * scalar;
}
