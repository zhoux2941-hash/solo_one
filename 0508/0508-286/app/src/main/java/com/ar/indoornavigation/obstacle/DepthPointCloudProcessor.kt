package com.ar.indoornavigation.obstacle

import android.util.Log
import com.ar.indoornavigation.model.Vector3
import com.google.ar.core.Frame
import kotlin.math.*

class DepthPointCloudProcessor {
    private val TAG = "DepthPointCloudProcessor"

    companion object {
        const val MIN_DEPTH_THRESHOLD = 0.1f
        const val MAX_DEPTH_THRESHOLD = 5.0f
        const val MIN_POINTS_PER_CLUSTER = 50
        const val CLUSTER_DISTANCE_THRESHOLD = 0.3f
        const val MAX_OBSTACLE_DISTANCE = 4.0f
    }

    data class DepthPoint(
        val x: Float,
        val y: Float,
        val z: Float,
        val confidence: Float
    )

    data class ObstacleCluster(
        val id: String,
        val center: Vector3,
        val size: Vector3,
        val points: List<DepthPoint>,
        val velocity: Vector3 = Vector3(0f, 0f, 0f),
        val confidence: Float = 1.0f,
        val isDynamic: Boolean = false,
        val obstacleType: ObstacleType = ObstacleType.UNKNOWN
    )

    enum class ObstacleType {
        PEDESTRIAN,
        CART,
        FURNITURE,
        WALL,
        DOOR,
        UNKNOWN
    }

    private val clusters = mutableListOf<ObstacleCluster>()
    private val previousFrameClusters = mutableListOf<ObstacleCluster>()

    fun processFrame(frame: Frame): List<ObstacleCluster> {
        try {
            val depthImage = frame.acquireDepthImage()
            val pointCloud = frame.acquirePointCloud()
            
            val depthPoints = extractValidDepthPoints(pointCloud)
            pointCloud.release()
            depthImage.close()

            val newClusters = performClustering(depthPoints)
            val classifiedClusters = classifyObstacles(newClusters)
            val trackedClusters = trackObstacles(classifiedClusters)
            
            previousFrameClusters.clear()
            previousFrameClusters.addAll(trackedClusters)
            
            return trackedClusters

        } catch (e: Exception) {
            Log.e(TAG, "Error processing depth frame", e)
            return emptyList()
        }
    }

    private fun extractValidDepthPoints(pointCloud: com.google.ar.core.PointCloud): List<DepthPoint> {
        val points = mutableListOf<DepthPoint>()
        val ids = pointCloud.ids
        val cloudPoints = pointCloud.points

        for (i in ids.indices) {
            val index = i * 4
            if (index + 3 < cloudPoints.limit()) {
                val x = cloudPoints[index]
                val y = cloudPoints[index + 1]
                val z = cloudPoints[index + 2]
                val confidence = cloudPoints[index + 3]

                if (z in MIN_DEPTH_THRESHOLD..MAX_DEPTH_THRESHOLD && confidence > 0.3f) {
                    points.add(DepthPoint(x, y, z, confidence))
                }
            }
        }

        return points
    }

    private fun performClustering(points: List<DepthPoint>): List<ObstacleCluster> {
        if (points.isEmpty()) return emptyList()

        val clusters = mutableListOf<MutableList<DepthPoint>>()
        val visited = BooleanArray(points.size)

        for (i in points.indices) {
            if (visited[i]) continue

            val cluster = mutableListOf<DepthPoint>()
            val queue = mutableListOf<Int>()
            queue.add(i)
            visited[i] = true

            while (queue.isNotEmpty()) {
                val currentIdx = queue.removeFirst()
                val currentPoint = points[currentIdx]
                cluster.add(currentPoint)

                for (j in points.indices) {
                    if (!visited[j]) {
                        val neighborPoint = points[j]
                        val distance = calculate3DDistance(currentPoint, neighborPoint)
                        
                        if (distance < CLUSTER_DISTANCE_THRESHOLD) {
                            visited[j] = true
                            queue.add(j)
                        }
                    }
                }
            }

            if (cluster.size >= MIN_POINTS_PER_CLUSTER) {
                clusters.add(cluster)
            }
        }

        return clusters.mapIndexed { index, clusterPoints ->
            createClusterFromPoints(clusterPoints, index)
        }
    }

    private fun calculate3DDistance(p1: DepthPoint, p2: DepthPoint): Float {
        val dx = p1.x - p2.x
        val dy = p1.y - p2.y
        val dz = p1.z - p2.z
        return sqrt(dx * dx + dy * dy + dz * dz)
    }

    private fun createClusterFromPoints(points: List<DepthPoint>, index: Int): ObstacleCluster {
        var minX = Float.MAX_VALUE
        var maxX = Float.MIN_VALUE
        var minY = Float.MAX_VALUE
        var maxY = Float.MIN_VALUE
        var minZ = Float.MAX_VALUE
        var maxZ = Float.MIN_VALUE

        var sumX = 0f
        var sumY = 0f
        var sumZ = 0f
        var sumConfidence = 0f

        for (point in points) {
            sumX += point.x * point.confidence
            sumY += point.y * point.confidence
            sumZ += point.z * point.confidence
            sumConfidence += point.confidence

            minX = min(minX, point.x)
            maxX = max(maxX, point.x)
            minY = min(minY, point.y)
            maxY = max(maxY, point.y)
            minZ = min(minZ, point.z)
            maxZ = max(maxZ, point.z)
        }

        val center = Vector3(
            sumX / sumConfidence,
            sumY / sumConfidence,
            sumZ / sumConfidence
        )

        val size = Vector3(
            maxX - minX,
            maxY - minY,
            maxZ - minZ
        )

        val avgConfidence = sumConfidence / points.size

        return ObstacleCluster(
            id = "obstacle_${System.currentTimeMillis()}_$index",
            center = center,
            size = size,
            points = points,
            confidence = avgConfidence
        )
    }

    private fun classifyObstacles(clusters: List<ObstacleCluster>): List<ObstacleCluster> {
        return clusters.map { cluster ->
            val type = classifyObstacleType(cluster)
            val isDynamic = isLikelyDynamic(cluster, type)
            
            cluster.copy(
                obstacleType = type,
                isDynamic = isDynamic
            )
        }
    }

    private fun classifyObstacleType(cluster: ObstacleCluster): ObstacleType {
        val (width, height, depth) = cluster.size

        if (height in 1.5f..2.2f && width in 0.3f..0.8f && depth in 0.3f..0.8f) {
            return ObstacleType.PEDESTRIAN
        }

        if (height in 0.5f..1.2f && width in 0.5f..1.5f && depth in 0.5f..1.5f) {
            return ObstacleType.CART
        }

        if (height > 0.5f && (width > 2.0f || depth > 2.0f) && width * depth < 1.0f) {
            return ObstacleType.WALL
        }

        if (height in 0.3f..1.0f && width in 0.5f..2.0f && depth in 0.5f..2.0f) {
            return ObstacleType.FURNITURE
        }

        return ObstacleType.UNKNOWN
    }

    private fun isLikelyDynamic(cluster: ObstacleCluster, type: ObstacleType): Boolean {
        if (type == ObstacleType.PEDESTRIAN || type == ObstacleType.CART) {
            return true
        }

        for (prevCluster in previousFrameClusters) {
            val distance = cluster.center.distanceTo(prevCluster.center)
            if (distance > 0.1f) {
                return true
            }
        }

        return false
    }

    private fun trackObstacles(currentClusters: List<ObstacleCluster>): List<ObstacleCluster> {
        val trackedClusters = mutableListOf<ObstacleCluster>()

        for (currentCluster in currentClusters) {
            var matchedPrevious: ObstacleCluster? = null
            var minDistance = Float.MAX_VALUE

            for (prevCluster in previousFrameClusters) {
                val distance = currentCluster.center.distanceTo(prevCluster.center)
                if (distance < 0.5f && distance < minDistance) {
                    minDistance = distance
                    matchedPrevious = prevCluster
                }
            }

            if (matchedPrevious != null) {
                val velocity = Vector3(
                    (currentCluster.center.x - matchedPrevious.center.x) * 30f,
                    (currentCluster.center.y - matchedPrevious.center.y) * 30f,
                    (currentCluster.center.z - matchedPrevious.center.z) * 30f
                )

                trackedClusters.add(
                    currentCluster.copy(
                        id = matchedPrevious.id,
                        velocity = velocity,
                        isDynamic = currentCluster.isDynamic || 
                                   matchedPrevious.isDynamic || 
                                   velocity.length() > 0.05f
                    )
                )
            } else {
                trackedClusters.add(currentCluster)
            }
        }

        return trackedClusters
    }

    fun getObstaclesInPath(
        pathPoints: List<Vector3>,
        robotPosition: Vector3,
        safetyMargin: Float = 0.5f
    ): List<ObstacleCluster> {
        val obstaclesInPath = mutableListOf<ObstacleCluster>()

        for (cluster in clusters) {
            if (cluster.center.z < 0 || cluster.center.z > MAX_OBSTACLE_DISTANCE) {
                continue
            }

            val minDistanceToPath = findMinimumDistanceToPath(cluster, pathPoints)
            val obstacleRadius = max(cluster.size.x, cluster.size.z) / 2f
            
            if (minDistanceToPath < obstacleRadius + safetyMargin) {
                obstaclesInPath.add(cluster)
            }
        }

        return obstaclesInPath
    }

    private fun findMinimumDistanceToPath(cluster: ObstacleCluster, pathPoints: List<Vector3>): Float {
        var minDistance = Float.MAX_VALUE

        for (i in 0 until pathPoints.size - 1) {
            val p1 = pathPoints[i]
            val p2 = pathPoints[i + 1]
            val dist = pointToLineDistance(cluster.center, p1, p2)
            minDistance = min(minDistance, dist)
        }

        return minDistance
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

    fun predictObstaclePosition(cluster: ObstacleCluster, timeDelta: Float): Vector3 {
        return Vector3(
            cluster.center.x + cluster.velocity.x * timeDelta,
            cluster.center.y + cluster.velocity.y * timeDelta,
            cluster.center.z + cluster.velocity.z * timeDelta
        )
    }

    fun getClusters(): List<ObstacleCluster> = clusters

    fun clear() {
        clusters.clear()
        previousFrameClusters.clear()
    }
}