package com.ar.indoornavigation.ar

import android.util.Log
import com.google.ar.core.Camera
import com.google.ar.core.Frame
import com.google.ar.core.Point
import com.google.ar.core.TrackingState
import kotlin.math.sqrt

class FeatureQualityChecker {
    private val TAG = "FeatureQualityChecker"

    enum class QualityLevel {
        EXCELLENT,   
        GOOD,        
        FAIR,        
        POOR,        
        CRITICAL     
    }

    data class FeaturePoint(
        val x: Float,
        val y: Float,
        val z: Float,
        val confidence: Float,
        val trackingState: TrackingState
    )

    data class QualityMetrics(
        val qualityLevel: QualityLevel,
        val featureCount: Int,
        val validFeatureRatio: Float,
        val spatialDistributionScore: Float,
        val averageConfidence: Float,
        val textureDiversityScore: Float,
        val overallScore: Float
    )

    private val MIN_FEATURES_EXCELLENT = 100
    private val MIN_FEATURES_GOOD = 60
    private val MIN_FEATURES_FAIR = 30
    private val MIN_FEATURES_POOR = 10

    private val GRID_SIZE = 4
    private val historyBuffer = ArrayDeque<QualityMetrics>(30)

    private val HISTORY_SIZE = 30

    fun analyzeFrame(frame: Frame, camera: Camera): QualityMetrics {
        val points = extractFeaturePoints(frame)
        val featureCount = points.size
        val validPoints = points.filter { it.trackingState == TrackingState.TRACKING }
        val validFeatureRatio = if (featureCount > 0) validPoints.size.toFloat() / featureCount else 0f

        val spatialScore = calculateSpatialDistribution(points)
        val avgConfidence = if (points.isNotEmpty()) points.map { it.confidence }.average().toFloat() else 0f
        val textureScore = calculateTextureDiversity(points)

        val overallScore = calculateOverallScore(
            featureCount,
            validFeatureRatio,
            spatialScore,
            avgConfidence,
            textureScore
        )

        val qualityLevel = determineQualityLevel(overallScore, featureCount)

        val metrics = QualityMetrics(
            qualityLevel = qualityLevel,
            featureCount = featureCount,
            validFeatureRatio = validFeatureRatio,
            spatialDistributionScore = spatialScore,
            averageConfidence = avgConfidence,
            textureDiversityScore = textureScore,
            overallScore = overallScore
        )

        historyBuffer.addLast(metrics)
        if (historyBuffer.size > HISTORY_SIZE) {
            historyBuffer.removeFirst()
        }

        return metrics
    }

    private fun extractFeaturePoints(frame: Frame): List<FeaturePoint> {
        val points = mutableListOf<FeaturePoint>()
        
        try {
            val pointCloud = frame.acquirePointCloud()
            val ids = pointCloud.ids
            val pointsArray = pointCloud.points
            val confidences = FloatArray(ids.size) { 1.0f }

            for (i in ids.indices) {
                val index = i * 4
                if (index + 3 < pointsArray.limit()) {
                    val x = pointsArray[index]
                    val y = pointsArray[index + 1]
                    val z = pointsArray[index + 2]
                    val confidence = pointsArray[index + 3]

                    points.add(
                        FeaturePoint(
                            x = x,
                            y = y,
                            z = z,
                            confidence = confidence,
                            trackingState = TrackingState.TRACKING
                        )
                    )
                }
            }
            
            pointCloud.release()
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting feature points", e)
        }

        return points
    }

    private fun calculateSpatialDistribution(points: List<FeaturePoint>): Float {
        if (points.isEmpty()) return 0f

        val grid = Array(GRID_SIZE) { IntArray(GRID_SIZE) { 0 } }

        var minX = Float.MAX_VALUE
        var maxX = Float.MIN_VALUE
        var minZ = Float.MAX_VALUE
        var maxZ = Float.MIN_VALUE

        for (point in points) {
            minX = minOf(minX, point.x)
            maxX = maxOf(maxX, point.x)
            minZ = minOf(minZ, point.z)
            maxZ = maxOf(maxZ, point.z)
        }

        val rangeX = maxX - minX
        val rangeZ = maxZ - minZ

        if (rangeX == 0f || rangeZ == 0f) return 0.1f

        for (point in points) {
            val gridX = ((point.x - minX) / rangeX * (GRID_SIZE - 1)).toInt().coerceIn(0, GRID_SIZE - 1)
            val gridZ = ((point.z - minZ) / rangeZ * (GRID_SIZE - 1)).toInt().coerceIn(0, GRID_SIZE - 1)
            grid[gridX][gridZ]++
        }

        var occupiedCells = 0
        for (i in 0 until GRID_SIZE) {
            for (j in 0 until GRID_SIZE) {
                if (grid[i][j] > 0) occupiedCells++
            }
        }

        val totalCells = GRID_SIZE * GRID_SIZE
        val distributionScore = occupiedCells.toFloat() / totalCells

        val meanPointsPerCell = points.size.toFloat() / totalCells
        var variance = 0f
        for (i in 0 until GRID_SIZE) {
            for (j in 0 until GRID_SIZE) {
                val diff = grid[i][j] - meanPointsPerCell
                variance += diff * diff
            }
        }
        variance /= totalCells

        val uniformityScore = if (variance == 0f) 1.0f else 1.0f / (1.0f + sqrt(variance) / meanPointsPerCell)

        return (distributionScore * 0.6f + uniformityScore * 0.4f)
    }

    private fun calculateTextureDiversity(points: List<FeaturePoint>): Float {
        if (points.size < 5) return 0f

        val coordinates = points.map { floatArrayOf(it.x, it.y, it.z) }
        
        var totalVariance = 0f
        for (dim in 0..2) {
            val values = coordinates.map { it[dim] }
            val mean = values.average().toFloat()
            val variance = values.map { (it - mean) * (it - mean) }.average().toFloat()
            totalVariance += variance
        }

        val normalizedVariance = 1.0f - exp(-totalVariance / 0.1f)

        return normalizedVariance.coerceIn(0f, 1f)
    }

    private fun calculateOverallScore(
        featureCount: Int,
        validRatio: Float,
        spatialScore: Float,
        avgConfidence: Float,
        textureScore: Float
    ): Float {
        val featureScore = when {
            featureCount >= MIN_FEATURES_EXCELLENT -> 1.0f
            featureCount >= MIN_FEATURES_GOOD -> 0.75f + 0.25f * (featureCount - MIN_FEATURES_GOOD).toFloat() / (MIN_FEATURES_EXCELLENT - MIN_FEATURES_GOOD)
            featureCount >= MIN_FEATURES_FAIR -> 0.4f + 0.35f * (featureCount - MIN_FEATURES_FAIR).toFloat() / (MIN_FEATURES_GOOD - MIN_FEATURES_FAIR)
            featureCount >= MIN_FEATURES_POOR -> 0.1f + 0.3f * (featureCount - MIN_FEATURES_POOR).toFloat() / (MIN_FEATURES_FAIR - MIN_FEATURES_POOR)
            else -> featureCount.toFloat() / MIN_FEATURES_POOR * 0.1f
        }

        return (
            featureScore * 0.35f +
            validRatio * 0.25f +
            spatialScore * 0.2f +
            avgConfidence * 0.1f +
            textureScore * 0.1f
        ).coerceIn(0f, 1f)
    }

    private fun determineQualityLevel(overallScore: Float, featureCount: Int): QualityLevel {
        return when {
            featureCount < MIN_FEATURES_POOR -> QualityLevel.CRITICAL
            overallScore >= 0.85f -> QualityLevel.EXCELLENT
            overallScore >= 0.7f -> QualityLevel.GOOD
            overallScore >= 0.5f -> QualityLevel.FAIR
            overallScore >= 0.3f -> QualityLevel.POOR
            else -> QualityLevel.CRITICAL
        }
    }

    fun getQualityTrend(): Float {
        if (historyBuffer.size < 5) return 0f

        val recent = historyBuffer.takeLast(5).map { it.overallScore }.average()
        val older = historyBuffer.take(historyBuffer.size - 5).map { it.overallScore }.average()

        return (recent - older).toFloat().coerceIn(-1f, 1f)
    }

    fun isLowTextureEnvironment(): Boolean {
        if (historyBuffer.isEmpty()) return false
        
        val recent = historyBuffer.takeLast(10)
        val avgTexture = recent.map { it.textureDiversityScore }.average()
        val avgFeatures = recent.map { it.featureCount }.average()

        return avgTexture < 0.3 || avgFeatures < MIN_FEATURES_FAIR
    }

    fun shouldWarnUser(): Boolean {
        if (historyBuffer.size < 3) return false

        val recent = historyBuffer.takeLast(3)
        return recent.all { 
            it.qualityLevel == QualityLevel.POOR || 
            it.qualityLevel == QualityLevel.CRITICAL 
        }
    }

    fun getRecommendation(): String {
        return when {
            isLowTextureEnvironment() -> "请移动到有更多纹理细节的区域"
            getQualityTrend() < -0.1f -> "请缓慢移动并扫描周围环境"
            historyBuffer.lastOrNull()?.qualityLevel == QualityLevel.CRITICAL -> "定位质量极差，请重新扫描环境"
            else -> "定位质量良好"
        }
    }

    private fun exp(x: Float): Float {
        return kotlin.math.exp(x)
    }
}