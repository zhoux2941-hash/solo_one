package com.ar.indoornavigation.ar

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import com.ar.indoornavigation.model.Vector3
import kotlin.math.*

class SensorFusionManager(context: Context) : SensorEventListener {
    private val TAG = "SensorFusionManager"

    private val sensorManager: SensorManager = 
        context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    private var gravity: Sensor? = null
    private var magnetometer: Sensor? = null
    private var rotationVector: Sensor? = null

    private val accelData = FloatArray(3)
    private val gyroData = FloatArray(3)
    private val gravityData = FloatArray(3)
    private val magData = FloatArray(3)
    private val rotationVectorData = FloatArray(5)

    private var hasAccel = false
    private var hasGyro = false
    private var hasGravity = false
    private var hasMag = false
    private var hasRotationVector = false

    private val rotationMatrix = FloatArray(9)
    private val orientation = FloatArray(3)

    private var lastTimestamp: Long = 0
    private val position = Vector3(0f, 0f, 0f)
    private val velocity = Vector3(0f, 0f, 0f)
    private var rotationQuaternion = floatArrayOf(1f, 0f, 0f, 0f)

    private val GRAVITY = 9.81f
    private val FILTER_TIME_CONSTANT = 0.5f
    private val MAX_ACCEL_DELTA = 2.0f

    private val historyBuffer = ArrayDeque<SensorSample>(100)
    private val HISTORY_SIZE = 100

    data class SensorSample(
        val timestamp: Long,
        val accel: Vector3,
        val gyro: Vector3,
        val gravity: Vector3,
        val rotation: FloatArray
    )

    data class FusionState(
        val position: Vector3,
        val velocity: Vector3,
        val acceleration: Vector3,
        val orientation: Vector3,
        val confidence: Float
    )

    private var fusedPosition = Vector3(0f, 0f, 0f)
    private var fusedVelocity = Vector3(0f, 0f, 0f)
    private var arPositionWeight = 0.9f
    private var imuPositionWeight = 0.1f

    private var visualQualityScore = 1.0f

    init {
        initializeSensors()
    }

    private fun initializeSensors() {
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        gravity = sensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY)
        magnetometer = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
        rotationVector = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)

        accelerometer?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        gyroscope?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        gravity?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        magnetometer?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        rotationVector?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event ?: return

        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                System.arraycopy(event.values, 0, accelData, 0, 3)
                hasAccel = true
            }
            Sensor.TYPE_GYROSCOPE -> {
                System.arraycopy(event.values, 0, gyroData, 0, 3)
                hasGyro = true
            }
            Sensor.TYPE_GRAVITY -> {
                System.arraycopy(event.values, 0, gravityData, 0, 3)
                hasGravity = true
            }
            Sensor.TYPE_MAGNETIC_FIELD -> {
                System.arraycopy(event.values, 0, magData, 0, 3)
                hasMag = true
            }
            Sensor.TYPE_ROTATION_VECTOR -> {
                System.arraycopy(event.values, 0, rotationVectorData, 0, event.values.size)
                hasRotationVector = true
            }
        }

        if (hasAccel && hasGyro) {
            updateSensorFusion(event.timestamp)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        Log.d(TAG, "Sensor ${sensor?.name} accuracy changed: $accuracy")
    }

    private fun updateSensorFusion(timestamp: Long) {
        if (lastTimestamp == 0L) {
            lastTimestamp = timestamp
            return
        }

        val dt = (timestamp - lastTimestamp) / 1000000000.0f
        lastTimestamp = timestamp

        if (hasRotationVector) {
            updateRotationFromVector()
        } else {
            updateRotationFromAccelMag()
        }

        updatePositionDeadReckoning(dt)

        val sample = SensorSample(
            timestamp = timestamp,
            accel = Vector3(accelData[0], accelData[1], accelData[2]),
            gyro = Vector3(gyroData[0], gyroData[1], gyroData[2]),
            gravity = Vector3(gravityData[0], gravityData[1], gravityData[2]),
            rotation = rotationQuaternion.copyOf()
        )

        historyBuffer.addLast(sample)
        if (historyBuffer.size > HISTORY_SIZE) {
            historyBuffer.removeFirst()
        }
    }

    private fun updateRotationFromVector() {
        SensorManager.getRotationMatrixFromVector(rotationMatrix, rotationVectorData)
        SensorManager.getOrientation(rotationMatrix, orientation)

        val x = rotationVectorData[0]
        val y = rotationVectorData[1]
        val z = rotationVectorData[2]
        val w = if (rotationVectorData.size > 3) rotationVectorData[3] else 1f

        rotationQuaternion[0] = w
        rotationQuaternion[1] = x
        rotationQuaternion[2] = y
        rotationQuaternion[3] = z
    }

    private fun updateRotationFromAccelMag() {
        if (!hasMag || !hasGravity) return

        val success = SensorManager.getRotationMatrix(
            rotationMatrix,
            null,
            gravityData,
            magData
        )

        if (success) {
            SensorManager.getOrientation(rotationMatrix, orientation)

            val halfRoll = orientation[2] * 0.5f
            val halfPitch = orientation[1] * 0.5f
            val halfYaw = orientation[0] * 0.5f

            val cosRoll = cos(halfRoll)
            val sinRoll = sin(halfRoll)
            val cosPitch = cos(halfPitch)
            val sinPitch = sin(halfPitch)
            val cosYaw = cos(halfYaw)
            val sinYaw = sin(halfYaw)

            rotationQuaternion[0] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll
            rotationQuaternion[1] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll
            rotationQuaternion[2] = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll
            rotationQuaternion[3] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll
        }
    }

    private fun updatePositionDeadReckoning(dt: Float) {
        val worldAccel = transformToWorldFrame(
            accelData[0] - gravityData[0],
            accelData[1] - gravityData[1],
            accelData[2] - gravityData[2]
        )

        val filteredAccel = lowPassFilter(
            worldAccel,
            velocity.toFloatArray(),
            FILTER_TIME_CONSTANT,
            dt
        )

        filteredAccel[0] = if (filteredAccel[0].absoluteValue < 0.1f) 0f else filteredAccel[0]
        filteredAccel[1] = if (filteredAccel[1].absoluteValue < 0.1f) 0f else filteredAccel[1]
        filteredAccel[2] = if (filteredAccel[2].absoluteValue < 0.1f) 0f else filteredAccel[2]

        velocity = Vector3(
            velocity.x + filteredAccel[0] * dt,
            velocity.y + filteredAccel[1] * dt,
            velocity.z + filteredAccel[2] * dt
        )

        val speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z)
        if (speed > 0.1f) {
            val damping = exp(-speed * dt)
            velocity = velocity.multiply(damping)
        }

        position = Vector3(
            position.x + velocity.x * dt + 0.5f * filteredAccel[0] * dt * dt,
            position.y + velocity.y * dt + 0.5f * filteredAccel[1] * dt * dt,
            position.z + velocity.z * dt + 0.5f * filteredAccel[2] * dt * dt
        )
    }

    private fun transformToWorldFrame(x: Float, y: Float, z: Float): FloatArray {
        val qw = rotationQuaternion[0]
        val qx = rotationQuaternion[1]
        val qy = rotationQuaternion[2]
        val qz = rotationQuaternion[3]

        val result = FloatArray(3)

        val ix = qw * x + qy * z - qz * y
        val iy = qw * y + qz * x - qx * z
        val iz = qw * z + qx * y - qy * x
        val iw = -qx * x - qy * y - qz * z

        result[0] = ix * qw + iw * -qx + (-iy) * -qz - (-iz) * -qy
        result[1] = iy * qw + iw * -qy + (-iz) * -qx - (-ix) * -qz
        result[2] = iz * qw + iw * -qz + (-ix) * -qy - (-iy) * -qx

        return result
    }

    private fun lowPassFilter(input: FloatArray, output: FloatArray, alpha: Float, dt: Float): FloatArray {
        val result = FloatArray(3)
        val alphaAdj = dt / (alpha + dt)
        for (i in 0..2) {
            result[i] = output[i] + alphaAdj * (input[i] - output[i])
        }
        return result
    }

    fun fuseWithARPosition(arPosition: Vector3, visualQuality: Float): FusionState {
        visualQualityScore = visualQuality

        arPositionWeight = 0.1f + visualQuality * 0.8f
        imuPositionWeight = 1.0f - arPositionWeight

        fusedPosition = Vector3(
            arPosition.x * arPositionWeight + position.x * imuPositionWeight,
            arPosition.y * arPositionWeight + position.y * imuPositionWeight,
            arPosition.z * arPositionWeight + position.z * imuPositionWeight
        )

        val confidence = calculateFusionConfidence()

        return FusionState(
            position = fusedPosition,
            velocity = velocity,
            acceleration = Vector3(accelData[0], accelData[1], accelData[2]),
            orientation = Vector3(orientation[0], orientation[1], orientation[2]),
            confidence = confidence
        )
    }

    private fun calculateFusionConfidence(): Float {
        var confidence = 0.5f

        if (hasRotationVector) confidence += 0.2f
        if (hasGyro) confidence += 0.1f
        if (hasAccel) confidence += 0.1f
        if (hasGravity) confidence += 0.1f

        confidence *= 0.5f + visualQualityScore * 0.5f

        return confidence.coerceIn(0f, 1f)
    }

    fun getPredictedPosition(dt: Float): Vector3 {
        return Vector3(
            fusedPosition.x + velocity.x * dt,
            fusedPosition.y + velocity.y * dt,
            fusedPosition.z + velocity.z * dt
        )
    }

    fun getOrientationAngles(): Vector3 {
        return Vector3(orientation[0], orientation[1], orientation[2])
    }

    fun reset() {
        position = Vector3(0f, 0f, 0f)
        velocity = Vector3(0f, 0f, 0f)
        fusedPosition = Vector3(0f, 0f, 0f)
        lastTimestamp = 0
        historyBuffer.clear()
    }

    fun destroy() {
        sensorManager.unregisterListener(this)
    }

    fun isStationary(): Boolean {
        val speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z)
        val accelMagnitude = sqrt(accelData[0] * accelData[0] + accelData[1] * accelData[1] + accelData[2] * accelData[2])

        return speed < 0.05f && (accelMagnitude - GRAVITY).absoluteValue < 0.5f
    }

    fun getMotionIntensity(): Float {
        val gyroMagnitude = sqrt(gyroData[0] * gyroData[0] + gyroData[1] * gyroData[1] + gyroData[2] * gyroData[2])
        val accelVariance = calculateAccelVariance()

        return gyroMagnitude * 0.5f + accelVariance * 0.5f
    }

    private fun calculateAccelVariance(): Float {
        if (historyBuffer.size < 10) return 0f

        val recent = historyBuffer.takeLast(10)
        val avgX = recent.map { it.accel.x }.average()
        val avgY = recent.map { it.accel.y }.average()
        val avgZ = recent.map { it.accel.z }.average()

        var variance = 0.0
        for (sample in recent) {
            val dx = sample.accel.x - avgX
            val dy = sample.accel.y - avgY
            val dz = sample.accel.z - avgZ
            variance += dx * dx + dy * dy + dz * dz
        }

        return sqrt(variance / recent.size).toFloat()
    }
}