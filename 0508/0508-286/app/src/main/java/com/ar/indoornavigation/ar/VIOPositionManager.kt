package com.ar.indoornavigation.ar

import android.content.Context
import android.util.Log
import com.ar.indoornavigation.model.Vector3
import com.google.ar.core.Camera
import com.google.ar.core.Plane
import com.google.ar.core.Pose
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.sqrt

class VIOPositionManager(private val context: Context) {
    private val TAG = "VIOPositionManager"

    private lateinit var sensorFusion: SensorFusionManager
    private lateinit var featureChecker: FeatureQualityChecker

    private var lastPosition = Vector3.zero()
    private var totalDistance = 0f
    private var driftAccumulated = 0f
    private var correctedPosition = Vector3.zero()

    private val positionHistory = mutableListOf<PositionSample>()
    private val MAX_HISTORY_SIZE = 200

    private val DRIFT_THRESHOLD_PER_10M = 1.0f
    private val DRIFT_WARNING_THRESHOLD = 0.5f

    private val anchorReferencePoints = mutableListOf<AnchorReference>()
    private val detectedPlanes = mutableListOf<PlaneInfo>()

    data class PositionSample(
        val position: Vector3,
        val timestamp: Long,
        val confidence: Float,
        val qualityScore: Float,
        val fused: Boolean = false
    )

    data class AnchorReference(
        val anchorId: String,
        val knownPosition: Vector3,
        val measuredPosition: Vector3,
        val timestamp: Long,
        val planeBounded: Boolean = false
    )

    data class PlaneInfo(
        val plane: Plane,
        val centerPose: Pose,
        val extentX: Float,
        val extentZ: Float,
        val normal: Vector3,
        val timestamp: Long
    )

    enum class DriftState {
        NORMAL,
        WARNING,
        CRITICAL,
        RECOVERING
    }

    private var driftState = DriftState.NORMAL
    private var lastDriftCorrection: Long = 0
    private val DRIFT_CORRECTION_INTERVAL = 2000L

    private var kalmanState = KalmanState()

    data class KalmanState(
        var x: Float = 0f, var y: Float = 0f, var z: Float = 0f,
        var vx: Float = 0f, var vy: Float = 0f, var vz: Float = 0f,
        var ax: Float = 0f, var ay: Float = 0f, var az: Float = 0f
    )

    private val P = Array(9) { FloatArray(9) { 0f } }
    private val Q = 0.01f
    private val R = 0.1f

    fun initialize() {
        sensorFusion = SensorFusionManager(context)
        featureChecker = FeatureQualityChecker()

        for (i in 0..8) {
            P[i][i] = 1.0f
        }
    }

    fun updatePosition(camera: Camera, frame: com.google.ar.core.Frame): Vector3 {
        val pose = camera.pose
        val rawARPosition = Vector3(pose)

        val qualityMetrics = featureChecker.analyzeFrame(frame, camera)
        val visualQuality = qualityMetrics.overallScore

        val fusionState = sensorFusion.fuseWithARPosition(rawARPosition, visualQuality)

        val filteredPosition = applyKalmanFilter(
            fusionState.position,
            fusionState.velocity,
            fusionState.acceleration
        )

        val planeConstrained = applyPlaneConstraints(filteredPosition)

        val finalPosition = if (driftState != DriftState.CRITICAL) {
            applyLoopClosureCorrection(planeConstrained, visualQuality)
        } else {
            fusionState.position
        }

        calculateDrift(finalPosition, visualQuality)

        if (positionHistory.isEmpty() || positionHistory.last().position.distanceTo(finalPosition) > 0.01f) {
            positionHistory.add(
                PositionSample(
                    finalPosition,
                    System.currentTimeMillis(),
                    camera.trackingState.ordinal.toFloat() / 2f,
                    visualQuality,
                    fused = true
                )
            )
        }
        if (positionHistory.size > MAX_HISTORY_SIZE) {
            positionHistory.removeFirst()
        }

        updateDriftState(visualQuality)

        lastPosition = finalPosition
        return finalPosition
    }

    private fun applyKalmanFilter(
        position: Vector3,
        velocity: Vector3,
        acceleration: Vector3
    ): Vector3 {
        val dt = 0.033f

        val F = createTransitionMatrix(dt)

        val x = floatArrayOf(
            kalmanState.x, kalmanState.y, kalmanState.z,
            kalmanState.vx, kalmanState.vy, kalmanState.vz,
            kalmanState.ax, kalmanState.ay, kalmanState.az
        )

        val xPred = FloatArray(9)
        multiplyMatrixVector(F, x, xPred)

        val FTP = Array(9) { FloatArray(9) }
        transposeMatrix(F, FTP)
        multiplyMatrix(F, P, P)
        multiplyMatrix(P, FTP, P)

        for (i in 0..8) {
            P[i][i] += Q
        }

        val H = createObservationMatrix()
        val z = floatArrayOf(position.x, position.y, position.z, velocity.x, velocity.y, velocity.z)

        val Ht = Array(6) { FloatArray(9) }
        transposeMatrix(H, Ht)

        val PHt = Array(9) { FloatArray(6) }
        multiplyMatrix(P, Ht, PHt)

        val HPHt = Array(6) { FloatArray(6) }
        multiplyMatrix(H, PHt, HPHt)
        for (i in 0..5) {
            HPHt[i][i] += R
        }

        val K = Array(9) { FloatArray(6) }
        invertMatrix(HPHt)
        multiplyMatrix(PHt, HPHt, K)

        val y = FloatArray(6)
        val hx = FloatArray(6)
        multiplyMatrixVector(H, xPred, hx)
        for (i in 0..5) {
            y[i] = z[i] - hx[i]
        }

        val Ky = FloatArray(9)
        multiplyMatrixVector(K, y, Ky)

        for (i in 0..8) {
            x[i] = xPred[i] + Ky[i]
        }

        val KH = Array(9) { FloatArray(9) }
        multiplyMatrix(K, H, KH)
        for (i in 0..8) {
            KH[i][i] = 1f - KH[i][i]
        }
        multiplyMatrix(KH, P, P)

        kalmanState = KalmanState(
            x[0], x[1], x[2],
            x[3], x[4], x[5],
            x[6], x[7], x[8]
        )

        return Vector3(x[0], x[1], x[2])
    }

    private fun createTransitionMatrix(dt: Float): Array<FloatArray> {
        val F = Array(9) { FloatArray(9) { 0f } }

        for (i in 0..2) {
            F[i][i] = 1f
            F[i][i + 3] = dt
            F[i][i + 6] = 0.5f * dt * dt
        }

        for (i in 3..5) {
            F[i][i] = 1f
            F[i][i + 3] = dt
        }

        for (i in 6..8) {
            F[i][i] = 1f
        }

        return F
    }

    private fun createObservationMatrix(): Array<FloatArray> {
        val H = Array(6) { FloatArray(9) { 0f } }

        H[0][0] = 1f
        H[1][1] = 1f
        H[2][2] = 1f
        H[3][3] = 1f
        H[4][4] = 1f
        H[5][5] = 1f

        return H
    }

    private fun multiplyMatrix(A: Array<FloatArray>, B: Array<FloatArray>, C: Array<FloatArray>) {
        val n = A.size
        val m = B[0].size
        val p = B.size

        for (i in 0 until n) {
            for (j in 0 until m) {
                C[i][j] = 0f
                for (k in 0 until p) {
                    C[i][j] += A[i][k] * B[k][j]
                }
            }
        }
    }

    private fun multiplyMatrixVector(A: Array<FloatArray>, v: FloatArray, result: FloatArray) {
        val n = A.size
        val m = v.size

        for (i in 0 until n) {
            result[i] = 0f
            for (j in 0 until m) {
                result[i] += A[i][j] * v[j]
            }
        }
    }

    private fun transposeMatrix(A: Array<FloatArray>, result: Array<FloatArray>) {
        val n = A.size
        val m = A[0].size

        for (i in 0 until n) {
            for (j in 0 until m) {
                result[j][i] = A[i][j]
            }
        }
    }

    private fun invertMatrix(A: Array<FloatArray>) {
        val n = A.size
        val augmented = Array(n) { FloatArray(2 * n) }

        for (i in 0 until n) {
            for (j in 0 until n) {
                augmented[i][j] = A[i][j]
            }
            augmented[i][i + n] = 1f
        }

        for (i in 0 until n) {
            var pivot = augmented[i][i]
            if (pivot == 0f) {
                for (j in i + 1 until n) {
                    if (augmented[j][i] != 0f) {
                        val temp = augmented[i]
                        augmented[i] = augmented[j]
                        augmented[j] = temp
                        break
                    }
                }
                pivot = augmented[i][i]
            }

            for (j in 0 until 2 * n) {
                augmented[i][j] /= pivot
            }

            for (j in 0 until n) {
                if (j != i) {
                    val factor = augmented[j][i]
                    for (k in 0 until 2 * n) {
                        augmented[j][k] -= factor * augmented[i][k]
                    }
                }
            }
        }

        for (i in 0 until n) {
            for (j in 0 until n) {
                A[i][j] = augmented[i][j + n]
            }
        }
    }

    private fun applyPlaneConstraints(position: Vector3): Vector3 {
        if (detectedPlanes.isEmpty()) return position

        var constrainedY = position.y
        var constraintCount = 0

        for (plane in detectedPlanes) {
            val planeY = plane.centerPose.ty()
            val normal = plane.normal

            if (normal.y > 0.9f) {
                val distance = abs(position.y - planeY)
                if (distance < 0.5f) {
                    val weight = exp(-distance * 2)
                    constrainedY = (constrainedY * constraintCount + planeY * weight) / (constraintCount + weight)
                    constraintCount++
                }
            }
        }

        return if (constraintCount > 0) {
            Vector3(position.x, constrainedY, position.z)
        } else {
            position
        }
    }

    fun addDetectedPlane(plane: Plane) {
        val planeInfo = PlaneInfo(
            plane = plane,
            centerPose = plane.centerPose,
            extentX = plane.extentX,
            extentZ = plane.extentZ,
            normal = Vector3(plane.centerPose.qx(), plane.centerPose.qy(), plane.centerPose.qz()),
            timestamp = System.currentTimeMillis()
        )

        val existingIndex = detectedPlanes.indexOfFirst { 
            it.plane == plane 
        }
        
        if (existingIndex >= 0) {
            detectedPlanes[existingIndex] = planeInfo
        } else {
            detectedPlanes.add(planeInfo)
        }

        while (detectedPlanes.size > 20) {
            detectedPlanes.removeFirst()
        }
    }

    private fun applyLoopClosureCorrection(position: Vector3, quality: Float): Vector3 {
        val now = System.currentTimeMillis()
        if (now - lastDriftCorrection < DRIFT_CORRECTION_INTERVAL) {
            return position
        }

        if (anchorReferencePoints.size < 3 || quality < 0.5f) {
            return position
        }

        var totalCorrectionX = 0f
        var totalCorrectionY = 0f
        var totalCorrectionZ = 0f
        var totalWeight = 0f

        for (ref in anchorReferencePoints.takeLast(10)) {
            val expectedDistance = position.distanceTo(ref.knownPosition)
            val measuredDistance = position.distanceTo(ref.measuredPosition)

            if (expectedDistance > 0 && expectedDistance < 10f) {
                val error = expectedDistance - measuredDistance
                val direction = ref.knownPosition.subtract(position).normalize()
                val weight = 1f / (1f + expectedDistance)

                totalCorrectionX += direction.x * error * weight
                totalCorrectionY += direction.y * error * weight * 0.5f
                totalCorrectionZ += direction.z * error * weight
                totalWeight += weight
            }
        }

        if (totalWeight > 0) {
            val correction = Vector3(
                totalCorrectionX / totalWeight,
                totalCorrectionY / totalWeight,
                totalCorrectionZ / totalWeight
            )

            val correctionAlpha = (quality * 0.3f).coerceIn(0f, 0.3f)

            correctedPosition = Vector3(
                position.x + correction.x * correctionAlpha,
                position.y + correction.y * correctionAlpha,
                position.z + correction.z * correctionAlpha
            )

            lastDriftCorrection = now
            driftAccumulated *= 0.7f

            Log.d(TAG, "Applied loop closure correction: $correction")
            return correctedPosition
        }

        return position
    }

    fun addAnchorReference(anchorId: String, actualPosition: Vector3, measuredPosition: Vector3) {
        val reference = AnchorReference(
            anchorId = anchorId,
            knownPosition = actualPosition,
            measuredPosition = measuredPosition,
            timestamp = System.currentTimeMillis(),
            planeBounded = detectedPlanes.isNotEmpty()
        )

        val existingIndex = anchorReferencePoints.indexOfFirst { it.anchorId == anchorId }
        if (existingIndex >= 0) {
            anchorReferencePoints[existingIndex] = reference
        } else {
            anchorReferencePoints.add(reference)
        }

        while (anchorReferencePoints.size > 50) {
            anchorReferencePoints.removeFirst()
        }
    }

    private fun calculateDrift(currentPosition: Vector3, quality: Float) {
        if (positionHistory.size < 2) return

        if (anchorReferencePoints.isNotEmpty()) {
            var totalDrift = 0f
            var validCount = 0

            for (ref in anchorReferencePoints.takeLast(5)) {
                val currentDistance = currentPosition.distanceTo(ref.knownPosition)
                val originalDistance = ref.measuredPosition.distanceTo(ref.knownPosition)
                val drift = abs(currentDistance - originalDistance)

                if (drift < 5f) {
                    totalDrift += drift
                    validCount++
                }
            }

            if (validCount > 0) {
                driftAccumulated = totalDrift / validCount
            }
        } else {
            driftAccumulated = (1f - quality) * 0.5f
        }
    }

    private fun updateDriftState(quality: Float) {
        val driftPer10m = getDriftPer10M()

        driftState = when {
            driftPer10m > DRIFT_THRESHOLD_PER_10M || quality < 0.2f -> DriftState.CRITICAL
            driftPer10m > DRIFT_WARNING_THRESHOLD || quality < 0.4f -> DriftState.WARNING
            driftState == DriftState.CRITICAL && quality > 0.6f -> DriftState.RECOVERING
            driftState == DriftState.RECOVERING && quality > 0.7f -> DriftState.NORMAL
            else -> DriftState.NORMAL
        }
    }

    fun getDriftPer10M(): Float {
        if (totalDistance < 0.5f) return 0f
        return (driftAccumulated / totalDistance) * 10f
    }

    fun getDriftPer100M(): Float {
        return getDriftPer10M() * 10f
    }

    fun isDriftExceeded(): Boolean {
        return driftState == DriftState.CRITICAL
    }

    fun isDriftWarning(): Boolean {
        return driftState == DriftState.WARNING || driftState == DriftState.CRITICAL
    }

    fun getDriftState(): DriftState = driftState

    fun getTotalDistance(): Float = totalDistance

    fun reset() {
        lastPosition = Vector3.zero()
        correctedPosition = Vector3.zero()
        totalDistance = 0f
        driftAccumulated = 0f
        driftState = DriftState.NORMAL
        positionHistory.clear()
        anchorReferencePoints.clear()
        detectedPlanes.clear()
        lastDriftCorrection = 0

        kalmanState = KalmanState()
        for (i in 0..8) {
            P[i][i] = 1.0f
        }

        sensorFusion.reset()
    }

    fun getSmoothedPosition(): Vector3 {
        return lastPosition
    }

    fun getVelocity(): Vector3 {
        return Vector3(kalmanState.vx, kalmanState.vy, kalmanState.vz)
    }

    fun getQualityMetrics(): FeatureQualityChecker.QualityMetrics? {
        return featureChecker.analyzeFrame(
            com.google.ar.core.Frame(),
            com.google.ar.core.Camera()
        ).takeIf { positionHistory.isNotEmpty() }
    }

    fun getUserRecommendation(): String {
        return featureChecker.getRecommendation()
    }

    fun destroy() {
        sensorFusion.destroy()
    }
}