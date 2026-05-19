package com.ar.indoornavigation.navigation

import android.util.Log
import com.ar.indoornavigation.model.*
import com.ar.indoornavigation.obstacle.DepthPointCloudProcessor
import com.ar.indoornavigation.obstacle.ObstacleManager
import java.util.*
import kotlin.math.*

class PathCalculator {
    private val TAG = "PathCalculator"

    companion object {
        const val OBSTACLE_COST_MULTIPLIER = 10f
        const val SAFETY_MARGIN = 0.8f
        const val DYNAMIC_OBSTACLE_PREDICTION_TIME = 1.0f
        const val MIN_REPLAN_DISTANCE = 0.5f
    }

    data class Node(
        val position: Vector3,
        val floor: Int,
        val parent: Node? = null,
        val g: Float = 0f,
        val h: Float = 0f,
        val cost: Float = 0f
    ) {
        val f: Float get() = g + h + cost
    }

    data class PathUpdate(
        val newPath: NavigationPath,
        val reason: ReplanReason,
        val obstaclesAvoided: Int,
        val isEmergency: Boolean
    )

    enum class ReplanReason {
        OBSTACLE_DETECTED,
        PATH_BLOCKED,
        USER_REQUEST,
        POSITION_DRIFT,
        TARGET_MOVED
    }

    private var currentPath: NavigationPath? = null
    private var lastReplanTime: Long = 0
    private val REPLAN_COOLDOWN = 300L

    fun calculatePath(
        startPosition: Vector3,
        startFloor: Int,
        targetPOI: POI,
        pois: List<POI>,
        floors: List<FloorMap>,
        avoidStairs: Boolean = false
    ): NavigationPath {
        Log.d(TAG, "Calculating path from floor $startFloor to ${targetPOI.name} on floor ${targetPOI.floorId}")

        val waypoints = mutableListOf<Vector3>()
        val floorTransitions = mutableListOf<FloorTransition>()

        waypoints.add(startPosition)

        if (startFloor != targetPOI.floorId) {
            val transitionPOIs = findFloorTransitionPOIs(pois, startFloor, targetPOI.floorId, avoidStairs)
            
            for (transitionPOI in transitionPOIs) {
                waypoints.add(transitionPOI.getPosition())
                
                val transitionType = when (transitionPOI.type) {
                    POIType.STAIRS -> TransitionType.STAIRS
                    POIType.ELEVATOR -> TransitionType.ELEVATOR
                    else -> TransitionType.STAIRS
                }
                
                floorTransitions.add(
                    FloorTransition(
                        fromFloor = startFloor,
                        toFloor = targetPOI.floorId,
                        transitionPoint = transitionPOI.getPosition(),
                        transitionType = transitionType
                    )
                )
            }
        }

        waypoints.add(targetPOI.getPosition())

        val refinedWaypoints = refinePathWithAStar(waypoints, pois, emptyList())

        val totalDistance = calculateTotalDistance(refinedWaypoints)
        val estimatedTime = estimateTravelTime(totalDistance, floorTransitions.size)

        val path = NavigationPath(
            id = UUID.randomUUID().toString(),
            mapId = targetPOI.mapId,
            startPOIId = "",
            endPOIId = targetPOI.id,
            waypoints = refinedWaypoints,
            totalDistance = totalDistance,
            estimatedTime = estimatedTime,
            floorTransitions = floorTransitions
        )

        currentPath = path
        return path
    }

    fun replanPathWithObstacles(
        currentPosition: Vector3,
        currentFloor: Int,
        targetPOI: POI,
        pois: List<POI>,
        floors: List<FloorMap>,
        obstacleManager: ObstacleManager,
        reason: ReplanReason = ReplanReason.OBSTACLE_DETECTED
    ): PathUpdate? {
        val now = System.currentTimeMillis()
        if (now - lastReplanTime < REPLAN_COOLDOWN) {
            return null
        }

        Log.d(TAG, "Re-planning path due to: $reason")

        val obstacles = obstacleManager.getAllObstacles()
        
        val waypoints = mutableListOf<Vector3>()
        val floorTransitions = mutableListOf<FloorTransition>()

        waypoints.add(currentPosition)

        if (currentFloor != targetPOI.floorId) {
            val transitionPOIs = findFloorTransitionPOIs(pois, currentFloor, targetPOI.floorId, false)
            for (transitionPOI in transitionPOIs) {
                waypoints.add(transitionPOI.getPosition())
            }
        }

        waypoints.add(targetPOI.getPosition())

        val refinedWaypoints = refinePathWithAStarAndObstacles(waypoints, pois, obstacleManager)

        val obstaclesAvoided = countObstaclesInPath(refinedWaypoints, obstacles)
        val isEmergency = obstacleManager.getAvoidanceStatus(
            currentPosition,
            currentPath?.waypoints ?: emptyList()
        ).warningLevel == ObstacleManager.WarningLevel.DANGER

        val totalDistance = calculateTotalDistance(refinedWaypoints)
        val estimatedTime = estimateTravelTime(totalDistance, floorTransitions.size)

        val newPath = NavigationPath(
            id = UUID.randomUUID().toString(),
            mapId = targetPOI.mapId,
            startPOIId = "",
            endPOIId = targetPOI.id,
            waypoints = refinedWaypoints,
            totalDistance = totalDistance,
            estimatedTime = estimatedTime,
            floorTransitions = floorTransitions
        )

        currentPath = newPath
        lastReplanTime = now

        return PathUpdate(
            newPath = newPath,
            reason = reason,
            obstaclesAvoided = obstaclesAvoided,
            isEmergency = isEmergency
        )
    }

    private fun findFloorTransitionPOIs(
        pois: List<POI>,
        fromFloor: Int,
        toFloor: Int,
        avoidStairs: Boolean
    ): List<POI> {
        val transitionTypes = if (avoidStairs) {
            listOf(POIType.ELEVATOR, POIType.ESCALATOR)
        } else {
            listOf(POIType.STAIRS, POIType.ELEVATOR, POIType.ESCALATOR)
        }

        val fromFloorTransitions = pois.filter {
            it.floorId == fromFloor && it.type in transitionTypes
        }

        val toFloorTransitions = pois.filter {
            it.floorId == toFloor && it.type in transitionTypes
        }

        return if (fromFloorTransitions.isNotEmpty()) {
            listOf(fromFloorTransitions.first())
        } else {
            emptyList()
        }
    }

    private fun refinePathWithAStar(
        waypoints: List<Vector3>,
        pois: List<POI>,
        obstacles: List<DepthPointCloudProcessor.ObstacleCluster>
    ): List<Vector3> {
        if (waypoints.size < 2) return waypoints

        val refinedWaypoints = mutableListOf<Vector3>()

        for (i in 0 until waypoints.size - 1) {
            val start = waypoints[i]
            val end = waypoints[i + 1]
            
            val pathSegment = aStarSearch(start, end, pois, obstacles)
            refinedWaypoints.addAll(pathSegment)
        }

        return refinedWaypoints.distinct()
    }

    private fun refinePathWithAStarAndObstacles(
        waypoints: List<Vector3>,
        pois: List<POI>,
        obstacleManager: ObstacleManager
    ): List<Vector3> {
        if (waypoints.size < 2) return waypoints

        val refinedWaypoints = mutableListOf<Vector3>()
        refinedWaypoints.add(waypoints.first())

        for (i in 0 until waypoints.size - 1) {
            val start = refinedWaypoints.last()
            val end = waypoints[i + 1]
            
            val pathSegment = aStarSearchWithObstacles(start, end, pois, obstacleManager)
            refinedWaypoints.addAll(pathSegment.drop(1))
        }

        return smoothPath(refinedWaypoints.distinct())
    }

    private fun aStarSearch(
        start: Vector3,
        end: Vector3,
        pois: List<POI>,
        obstacles: List<DepthPointCloudProcessor.ObstacleCluster>
    ): List<Vector3> {
        val openSet = PriorityQueue<Node>(compareBy { it.f })
        val closedSet = mutableSetOf<Vector3>()

        val startNode = Node(start, 0, null, 0f, heuristic(start, end))
        openSet.add(startNode)

        while (openSet.isNotEmpty()) {
            val current = openSet.poll()

            if (current.position.distanceTo(end) < 0.5f) {
                return reconstructPath(current)
            }

            closedSet.add(current.position)

            val neighbors = generateNeighbors(current.position, pois)

            for (neighborPos in neighbors) {
                if (neighborPos in closedSet) continue

                val obstacleCost = calculateObstacleCost(neighborPos, obstacles)
                val g = current.g + current.position.distanceTo(neighborPos)
                val h = heuristic(neighborPos, end)
                val neighborNode = Node(neighborPos, 0, current, g, h, obstacleCost)

                val existingInOpen = openSet.find { it.position == neighborPos }
                if (existingInOpen == null || neighborNode.f < existingInOpen.f) {
                    if (existingInOpen != null) {
                        openSet.remove(existingInOpen)
                    }
                    openSet.add(neighborNode)
                }
            }
        }

        return listOf(start, end)
    }

    private fun aStarSearchWithObstacles(
        start: Vector3,
        end: Vector3,
        pois: List<POI>,
        obstacleManager: ObstacleManager
    ): List<Vector3> {
        val openSet = PriorityQueue<Node>(compareBy { it.f })
        val closedSet = mutableSetOf<Vector3>()
        val obstacles = obstacleManager.getAllObstacles()

        val startNode = Node(start, 0, null, 0f, heuristic(start, end))
        openSet.add(startNode)

        var iterations = 0
        val maxIterations = 500

        while (openSet.isNotEmpty() && iterations < maxIterations) {
            iterations++
            val current = openSet.poll()

            if (current.position.distanceTo(end) < 0.5f) {
                return reconstructPath(current)
            }

            closedSet.add(current.position)

            val neighbors = generateNeighborsWithObstacles(current.position, pois, obstacles)

            for (neighborPos in neighbors) {
                if (neighborPos in closedSet) continue

                val obstacleCost = calculateObstacleCostForManager(neighborPos, obstacles)
                val dynamicCost = calculateDynamicObstacleCost(neighborPos, obstacles)
                
                val g = current.g + current.position.distanceTo(neighborPos)
                val h = heuristic(neighborPos, end)
                val totalCost = obstacleCost + dynamicCost
                
                val neighborNode = Node(neighborPos, 0, current, g, h, totalCost)

                val existingInOpen = openSet.find { it.position == neighborPos }
                if (existingInOpen == null || neighborNode.f < existingInOpen.f) {
                    if (existingInOpen != null) {
                        openSet.remove(existingInOpen)
                    }
                    openSet.add(neighborNode)
                }
            }
        }

        Log.w(TAG, "A* search timed out after $iterations iterations, returning direct path")
        return listOf(start, end)
    }

    private fun generateNeighbors(position: Vector3, pois: List<POI>): List<Vector3> {
        val neighbors = mutableListOf<Vector3>()
        val stepSize = 0.5f

        for (dx in -1..1) {
            for (dz in -1..1) {
                if (dx == 0 && dz == 0) continue
                val neighborPos = Vector3(
                    position.x + dx * stepSize,
                    position.y,
                    position.z + dz * stepSize
                )
                neighbors.add(neighborPos)
            }
        }

        for (poi in pois) {
            if (position.distanceTo(poi.getPosition()) < 5f) {
                neighbors.add(poi.getPosition())
            }
        }

        return neighbors
    }

    private fun generateNeighborsWithObstacles(
        position: Vector3,
        pois: List<POI>,
        obstacles: List<ObstacleManager.TrackedObstacle>
    ): List<Vector3> {
        val neighbors = mutableListOf<Vector3>()
        val stepSize = 0.4f

        for (dx in -1..1) {
            for (dz in -1..1) {
                if (dx == 0 && dz == 0) continue
                val neighborPos = Vector3(
                    position.x + dx * stepSize,
                    position.y,
                    position.z + dz * stepSize
                )
                
                if (!isPositionBlocked(neighborPos, obstacles)) {
                    neighbors.add(neighborPos)
                }
            }
        }

        for (poi in pois) {
            if (position.distanceTo(poi.getPosition()) < 5f) {
                val poiPos = poi.getPosition()
                if (!isPositionBlocked(poiPos, obstacles)) {
                    neighbors.add(poiPos)
                }
            }
        }

        return neighbors
    }

    private fun isPositionBlocked(
        position: Vector3,
        obstacles: List<ObstacleManager.TrackedObstacle>
    ): Boolean {
        for (obstacle in obstacles) {
            val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f
            val distance = position.distanceTo(obstacle.currentPosition)
            
            if (distance < obstacleRadius + 0.3f) {
                return true
            }

            if (obstacle.isDynamic) {
                val predictedPos = Vector3(
                    obstacle.currentPosition.x + obstacle.velocity.x * 0.5f,
                    obstacle.currentPosition.y + obstacle.velocity.y * 0.5f,
                    obstacle.currentPosition.z + obstacle.velocity.z * 0.5f
                )
                val predictedDistance = position.distanceTo(predictedPos)
                if (predictedDistance < obstacleRadius + 0.5f) {
                    return true
                }
            }
        }
        return false
    }

    private fun calculateObstacleCost(
        position: Vector3,
        obstacles: List<DepthPointCloudProcessor.ObstacleCluster>
    ): Float {
        var totalCost = 0f

        for (obstacle in obstacles) {
            val distance = position.distanceTo(obstacle.center)
            val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f
            
            if (distance < obstacleRadius + SAFETY_MARGIN * 2) {
                val normalizedDist = (distance - obstacleRadius) / SAFETY_MARGIN
                val cost = (1f - normalizedDist.coerceIn(0f, 1f)) * OBSTACLE_COST_MULTIPLIER
                totalCost += cost
            }
        }

        return totalCost
    }

    private fun calculateObstacleCostForManager(
        position: Vector3,
        obstacles: List<ObstacleManager.TrackedObstacle>
    ): Float {
        var totalCost = 0f

        for (obstacle in obstacles) {
            val distance = position.distanceTo(obstacle.currentPosition)
            val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f
            
            if (distance < obstacleRadius + SAFETY_MARGIN * 2) {
                val normalizedDist = (distance - obstacleRadius) / SAFETY_MARGIN
                var cost = (1f - normalizedDist.coerceIn(0f, 1f)) * OBSTACLE_COST_MULTIPLIER
                
                if (obstacle.isDynamic) {
                    cost *= 1.5f
                }
                
                cost *= obstacle.confidence
                
                totalCost += cost
            }
        }

        return totalCost
    }

    private fun calculateDynamicObstacleCost(
        position: Vector3,
        obstacles: List<ObstacleManager.TrackedObstacle>
    ): Float {
        var totalCost = 0f

        for (obstacle in obstacles) {
            if (!obstacle.isDynamic) continue

            val predictedPosition = Vector3(
                obstacle.currentPosition.x + obstacle.velocity.x * DYNAMIC_OBSTACLE_PREDICTION_TIME,
                obstacle.currentPosition.y + obstacle.velocity.y * DYNAMIC_OBSTACLE_PREDICTION_TIME,
                obstacle.currentPosition.z + obstacle.velocity.z * DYNAMIC_OBSTACLE_PREDICTION_TIME
            )

            val distance = position.distanceTo(predictedPosition)
            val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f
            
            if (distance < obstacleRadius + SAFETY_MARGIN * 3) {
                val normalizedDist = (distance - obstacleRadius) / (SAFETY_MARGIN * 2)
                val cost = (1f - normalizedDist.coerceIn(0f, 1f)) * OBSTACLE_COST_MULTIPLIER * 2f
                totalCost += cost * obstacle.confidence
            }
        }

        return totalCost
    }

    private fun countObstaclesInPath(
        waypoints: List<Vector3>,
        obstacles: List<ObstacleManager.TrackedObstacle>
    ): Int {
        var count = 0
        
        for (i in 0 until waypoints.size - 1) {
            val p1 = waypoints[i]
            val p2 = waypoints[i + 1]
            
            for (obstacle in obstacles) {
                val distToSegment = pointToLineDistance(obstacle.currentPosition, p1, p2)
                val obstacleRadius = max(obstacle.size.x, obstacle.size.z) / 2f
                
                if (distToSegment < obstacleRadius + SAFETY_MARGIN * 1.5f) {
                    count++
                    break
                }
            }
        }
        
        return count
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

    private fun heuristic(a: Vector3, b: Vector3): Float {
        val dx = abs(a.x - b.x)
        val dy = abs(a.y - b.y)
        val dz = abs(a.z - b.z)
        return dx + dy + dz
    }

    private fun reconstructPath(node: Node): List<Vector3> {
        val path = mutableListOf<Vector3>()
        var current: Node? = node
        while (current != null) {
            path.add(current.position)
            current = current.parent
        }
        return path.reversed()
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

    private fun calculateTotalDistance(waypoints: List<Vector3>): Float {
        var total = 0f
        for (i in 0 until waypoints.size - 1) {
            total += waypoints[i].distanceTo(waypoints[i + 1])
        }
        return total
    }

    private fun estimateTravelTime(distance: Float, transitions: Int): Int {
        val walkingSpeed = 1.4f
        val transitionTime = 15

        val walkingTime = (distance / walkingSpeed).toInt()
        val transitionTotalTime = transitions * transitionTime

        return walkingTime + transitionTotalTime
    }

    fun getPathProgress(
        currentPosition: Vector3,
        waypoints: List<Vector3>,
        currentWaypointIndex: Int
    ): Int {
        if (waypoints.isEmpty()) return 0

        val totalDistance = calculateTotalDistance(waypoints)
        if (totalDistance == 0f) return 100

        var traveledDistance = 0f
        for (i in 0 until currentWaypointIndex) {
            traveledDistance += waypoints[i].distanceTo(waypoints[i + 1])
        }

        if (currentWaypointIndex < waypoints.size) {
            traveledDistance += waypoints[currentWaypointIndex].distanceTo(currentPosition)
        }

        return ((traveledDistance / totalDistance) * 100).toInt()
    }

    fun getNextDirection(
        currentPosition: Vector3,
        currentOrientation: Float,
        nextWaypoint: Vector3
    ): NavigationDirection {
        val direction = nextWaypoint.subtract(currentPosition).normalize()
        val targetAngle = atan2(direction.z, direction.x) * (180f / PI)

        var angleDiff = targetAngle - currentOrientation
        while (angleDiff > 180) angleDiff -= 360
        while (angleDiff < -180) angleDiff += 360

        return when {
            abs(angleDiff) < 20 -> NavigationDirection.STRAIGHT
            angleDiff > 20 -> NavigationDirection.RIGHT
            angleDiff < -20 -> NavigationDirection.LEFT
            else -> NavigationDirection.STRAIGHT
        }
    }

    fun needsReplan(
        currentPosition: Vector3,
        avoidanceStatus: ObstacleManager.AvoidanceStatus,
        pathDeviationThreshold: Float = 0.8f
    ): Boolean {
        if (avoidanceStatus.needsReplan) return true

        if (avoidanceStatus.warningLevel == ObstacleManager.WarningLevel.DANGER) {
            return true
        }

        if (avoidanceStatus.warningLevel == ObstacleManager.WarningLevel.WARNING &&
            avoidanceStatus.blockedPathPercentage > 0.3f) {
            return true
        }

        return false
    }

    fun getCurrentPath(): NavigationPath? = currentPath

    fun clearCurrentPath() {
        currentPath = null
    }
}

enum class NavigationDirection {
    STRAIGHT,
    LEFT,
    RIGHT,
    UTURN,
    UPSTAIRS,
    DOWNSTAIRS,
    ELEVATOR,
    ARRIVED,
    AVOID_LEFT,
    AVOID_RIGHT,
    SLOW_DOWN,
    STOP
}