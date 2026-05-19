package com.ar.indoornavigation.obstacle

import android.util.Log
import com.ar.indoornavigation.model.Vector3
import com.google.ar.core.Frame
import kotlin.math.*

class ObstacleManager {
    private val TAG = "ObstacleManager"

    companion object {
        const val OBSTACLE_HISTORY_SIZE = 10
        const val MIN_CONFIDENCE_FOR_AVOIDANCE = 0.5f
        const val REPLAN_DISTANCE_THRESHOLD = 2.0f
        const val REPLAN_TIME_INTERVAL = 500L
    }

    data class TrackedObstacle(
        val id: String,
        val type: DepthPointCloudProcessor.ObstacleType,
        val currentPosition: Vector3,
        val predictedPosition: Vector3,
        val velocity: Vector3,
        val size: Vector3,
        val confidence: Float,
        val isDynamic: Boolean,
        val history: MutableList<Vector3> = mutableListOf(),
        val firstSeenTime: Long = System.currentTimeMillis(),
        val lastSeenTime: Long = System.currentTimeMillis()
    )

    data class AvoidanceStatus(
        val isAvoiding: Boolean,
        val needsReplan: Boolean,
        val nearestObstacle: TrackedObstacle?,
        val distanceToNearest: Float,
        val blockedPathPercentage: Float,
        val warningLevel: WarningLevel
    )

    enum class WarningLevel {
        SAFE,
        CAUTION,
        WARNING,
        DANGER
    }

    private val depthProcessor = DepthPointCloudProcessor()
    private val trackedObstacles = mutableMapOf<String, TrackedObstacle>()
    private var lastReplanTime: Long = 0

    fun update(frame: Frame, currentPosition: Vector3) {
        val clusters = depthProcessor.processFrame(frame)
        updateTrackedObstacles(clusters)
        cleanupOldObstacles()
    }

    private fun updateTrackedObstacles(clusters: List<DepthPointCloudProcessor.ObstacleCluster>) {
        val matchedIds = mutableSetOf<String>()

        for (cluster in clusters) {
            var matchedObstacle: TrackedObstacle? = null
            var minDistance = Float.MAX_VALUE

            for (obstacle in trackedObstacles.values) {
                val distance = cluster.center.distanceTo(obstacle.currentPosition)
                if (distance < 0.5f && distance < minDistance) {
                    minDistance = distance
                    matchedObstacle = obstacle
                }
            }

            if (matchedObstacle != null) {
                matchedIds.add(matchedObstacle.id)
                updateExistingObstacle(matchedObstacle, cluster)
            } else {
                addNewObstacle(cluster)
            }
        }
    }

    private fun updateExistingObstacle(
        obstacle: TrackedObstacle,
        cluster: DepthPointCloudProcessor.ObstacleCluster
    ) {
        obstacle.history.add(cluster.center)
        if (obstacle.history.size > OBSTACLE_HISTORY_SIZE) {
            obstacle.history.removeFirst()
        }

        val smoothedPosition = if (obstacle.history.size >= 3) {
            val recent = obstacle.history.takeLast(3)
            Vector3(
                recent.map { it.x }.average().toFloat(),
                recent.map { it.y }.average().toFloat(),
                recent.map { it.z }.average().toFloat()
            )
        } else {
            cluster.center
        }

        val velocity = calculateSmoothedVelocity(obstacle)
        val predictedPosition = predictFuturePosition(obstacle, smoothedPosition, velocity)

        val updatedObstacle = obstacle.copy(
            currentPosition = smoothedPosition,
            predictedPosition = predictedPosition,
            velocity = velocity,
            size = cluster.size,
            confidence = cluster.confidence,
            isDynamic = cluster.isDynamic,
            lastSeenTime = System.currentTimeMillis()
        )

        trackedObstacles[obstacle.id] = updatedObstacle
    }

    private fun calculateSmoothedVelocity(obstacle: TrackedObstacle): Vector3 {
        if (obstacle.history.size < 2) return obstacle.velocity

        val velocities = mutableListOf<Vector3>()
        for (i in 1 until obstacle.history.size) {
            val pos1 = obstacle.history[i - 1]
            val pos2 = obstacle.history[i]
            val vel = pos2.subtract(pos1).multiply(30f)
            velocities.add(vel)
        }

        return Vector3(
            velocities.map { it.x }.average().toFloat(),
            velocities.map { it.y }.average().toFloat(),
            velocities.map { it.z }.average().toFloat()
        )
    }

    private fun predictFuturePosition(
        obstacle: TrackedObstacle,
        currentPos: Vector3,
        velocity: Vector3,
        predictionTime: Float = 1.0f
    ): Vector3 {
        return Vector3(
            currentPos.x + velocity.x * predictionTime,
            currentPos.y + velocity.y * predictionTime,
            currentPos.z + velocity.z * predictionTime
        )
    }

    private fun addNewObstacle(cluster: DepthPointCloudProcessor.ObstacleCluster) {
        val obstacle = TrackedObstacle(
            id = cluster.id,
            type = cluster.obstacleType,
            currentPosition = cluster.center,
            predictedPosition = cluster.center,
            velocity = cluster.velocity,
            size = cluster.size,
            confidence = cluster.confidence,
            isDynamic = cluster.isDynamic
        )
        trackedObstacles[cluster.id] = obstacle
    }

    private fun cleanupOldObstacles() {
        val now = System.currentTimeMillis()
        val toRemove = mutableListOf<String>()

        for (obstacle in trackedObstacles.values) {
            if (now - obstacle.lastSeenTime > 2000) {
                toRemove.add(obstacle.id)
            }
        }

        for (id in toRemove) {
            trackedObstacles.remove(id)
        }
    }

    fun getAvoidanceStatus(
        currentPosition: Vector3,
        pathPoints: List<Vector3>,
        safetyMargin: Float = 0.5f
    ): AvoidanceStatus {
        if (trackedObstacles.isEmpty() || pathPoints.size < 2) {
            return AvoidanceStatus(
                isAvoiding = false,
                needsReplan = false,
                nearestObstacle = null,
                distanceToNearest = Float.MAX_VALUE,
                blockedPathPercentage = 0f,
                warningLevel = WarningLevel.SAFE
            )
        }

        var nearestObstacle: TrackedObstacle? = null
        var minDistance = Float.MAX_VALUE
        var blockedSegments = 0

        for (obstacle in trackedObstacles.values) {
            if (obstacle.confidence < MIN_CONFIDENCE_FOR_AVOIDANCE) continue

            val distanceToRobot = obstacle.currentPosition.distanceTo(currentPosition)

            if (distanceToRobot < minDistance) {
                minDistance = distanceToRobot
                nearestObstacle = obstacle
            }

            for (i in 0 until pathPoints.size - 1) {
                val p1 = pathPoints[i]
                val p2 = pathPoints[i + 1]
                val distToSegment = pointToLineDistance(obstacle.currentPosition, p1, p2)
                val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f

                if (distToSegment < obstacleRadius + safetyMargin) {
                    blockedSegments++
                    break
                }
            }
        }

        val blockedPercentage = if (pathPoints.size > 1) {
            blockedSegments.toFloat() / (pathPoints.size - 1)
        } else {
            0f
        }

        val warningLevel = when {
            minDistance < 0.8f || blockedPercentage > 0.5f -> WarningLevel.DANGER
            minDistance < 1.5f || blockedPercentage > 0.3f -> WarningLevel.WARNING
            minDistance < 2.5f || blockedPercentage > 0.1f -> WarningLevel.CAUTION
            else -> WarningLevel.SAFE
        }

        val now = System.currentTimeMillis()
        val needsReplan = (blockedPercentage > 0.2f || minDistance < 1.5f) &&
                         (now - lastReplanTime > REPLAN_TIME_INTERVAL)

        if (needsReplan) {
            lastReplanTime = now
        }

        return AvoidanceStatus(
            isAvoiding = blockedPercentage > 0f,
            needsReplan = needsReplan,
            nearestObstacle = nearestObstacle,
            distanceToNearest = minDistance,
            blockedPathPercentage = blockedPercentage,
            warningLevel = warningLevel
        )
    }

    private fun pointToLineDistance(point: Vector3, lineStart: Vector3, lineEnd: Vector3): Float {
        val lineVector = lineEnd.subtract(lineStart)
        val lineLength = lineVector.length()
        
        if (lineLength < 0.001f) {
            return point.distanceTo(lineStart)
        }

        val t = max(0f, min(1f, point.subtract(lineStart).dot(lineVector) / (lineLength * lineLength)))
        val closestPoint = lineStart.add(lineVector.multiply(t))
        return point.distanceTo(closestPoint)
    }

    fun getAvoidanceWaypoints(
        originalPath: List<Vector3>,
        currentPosition: Vector3,
        safetyMargin: Float = 0.8f
    ): List<Vector3> {
        if (trackedObstacles.isEmpty()) return originalPath

        val avoidancePath = mutableListOf<Vector3>()
        avoidancePath.add(currentPosition)

        for (i in 0 until originalPath.size - 1) {
            val startPoint = if (i == 0) currentPosition else originalPath[i]
            val endPoint = originalPath[i + 1]

            var hasObstacle = false
            var nearestObstacle: TrackedObstacle? = null
            var nearestDist = Float.MAX_VALUE

            for (obstacle in trackedObstacles.values) {
                if (obstacle.confidence < MIN_CONFIDENCE_FOR_AVOIDANCE) continue

                val distToSegment = pointToLineDistance(obstacle.currentPosition, startPoint, endPoint)
                val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f

                if (distToSegment < obstacleRadius + safetyMargin && distToSegment < nearestDist) {
                    nearestDist = distToSegment
                    nearestObstacle = obstacle
                    hasObstacle = true
                }
            }

            if (hasObstacle && nearestObstacle != null) {
                val detourPoint = calculateDetourPoint(
                    startPoint,
                    endPoint,
                    nearestObstacle,
                    safetyMargin
                )
                avoidancePath.add(detourPoint)
            }

            avoidancePath.add(endPoint)
        }

        return smoothPath(avoidancePath)
    }

    private fun calculateDetourPoint(
        start: Vector3,
        end: Vector3,
        obstacle: TrackedObstacle,
        safetyMargin: Float
    ): Vector3 {
        val pathDirection = end.subtract(start).normalize()
        val toObstacle = obstacle.currentPosition.subtract(start).normalize()

        val crossProduct = Vector3(
            pathDirection.z * toObstacle.y - pathDirection.y * toObstacle.z,
            pathDirection.x * toObstacle.z - pathDirection.z * toObstacle.x,
            pathDirection.y * toObstacle.x - pathDirection.x * toObstacle.y
        )

        val perpendicular = if (crossProduct.length() > 0.1f) {
            crossProduct.normalize()
        } else {
            Vector3(-pathDirection.z, 0f, pathDirection.x)
        }

        val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f
        val detourDistance = obstacleRadius + safetyMargin

        val midPoint = Vector3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            (start.z + end.z) / 2
        )

        val projectedDist = obstacle.currentPosition.distanceTo(midPoint)
        val detourFactor = if (projectedDist < detourDistance) 1.5f else 1.0f

        val detourPoint = obstacle.currentPosition.add(
            Vector3(
                perpendicular.x * detourDistance * detourFactor,
                0f,
                perpendicular.z * detourDistance * detourFactor
            )
        )

        if (obstacle.isDynamic) {
            val futurePosition = Vector3(
                obstacle.currentPosition.x + obstacle.velocity.x * 0.5f,
                obstacle.currentPosition.y + obstacle.velocity.y * 0.5f,
                obstacle.currentPosition.z + obstacle.velocity.z * 0.5f
            )

            val directionToFuture = futurePosition.subtract(obstacle.currentPosition).normalize()
            return detourPoint.add(directionToFuture.multiply(detourDistance * 0.5f))
        }

        return detourPoint
    }

    private fun smoothPath(path: List<Vector3>): List<Vector3> {
        if (path.size < 3) return path

        val smoothed = mutableListOf<Vector3>()
        smoothed.add(path.first())

        for (i in 1 until path.size - 1) {
            val prev = path[i - 1]
            val curr = path[i]
            val next = path[i + 1]

            val smoothPoint = Vector3(
                (prev.x + 4 * curr.x + next.x) / 6f,
                (prev.y + 4 * curr.y + next.y) / 6f,
                (prev.z + 4 * curr.z + next.z) / 6f
            )
            smoothed.add(smoothPoint)
        }

        smoothed.add(path.last())
        return smoothed
    }

    fun getAllObstacles(): List<TrackedObstacle> = trackedObstacles.values.toList()

    fun getDynamicObstacles(): List<TrackedObstacle> = 
        trackedObstacles.values.filter { it.isDynamic }

    fun getObstaclesByType(type: DepthPointCloudProcessor.ObstacleType): List<TrackedObstacle> =
        trackedObstacles.values.filter { it.type == type }

    fun clear() {
        trackedObstacles.clear()
        depthProcessor.clear()
        lastReplanTime = 0
    }
}