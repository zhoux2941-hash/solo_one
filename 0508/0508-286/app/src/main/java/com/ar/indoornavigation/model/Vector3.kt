package com.ar.indoornavigation.model

import com.google.ar.core.Pose
import kotlin.math.sqrt

data class Vector3(
    val x: Float = 0f,
    val y: Float = 0f,
    val z: Float = 0f
) {
    constructor(pose: Pose) : this(pose.tx(), pose.ty(), pose.tz())

    fun distanceTo(other: Vector3): Float {
        val dx = x - other.x
        val dy = y - other.y
        val dz = z - other.z
        return sqrt(dx * dx + dy * dy + dz * dz)
    }

    fun add(other: Vector3): Vector3 {
        return Vector3(x + other.x, y + other.y, z + other.z)
    }

    fun subtract(other: Vector3): Vector3 {
        return Vector3(x - other.x, y - other.y, z - other.z)
    }

    fun multiply(scalar: Float): Vector3 {
        return Vector3(x * scalar, y * scalar, z * scalar)
    }

    fun length(): Float {
        return sqrt(x * x + y * y + z * z)
    }

    fun normalize(): Vector3 {
        val len = length()
        return if (len > 0) Vector3(x / len, y / len, z / len) else this
    }

    fun toFloatArray(): FloatArray = floatArrayOf(x, y, z)

    companion object {
        fun lerp(a: Vector3, b: Vector3, t: Float): Vector3 {
            return Vector3(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t,
                a.z + (b.z - a.z) * t
            )
        }

        fun zero() = Vector3(0f, 0f, 0f)
    }
}