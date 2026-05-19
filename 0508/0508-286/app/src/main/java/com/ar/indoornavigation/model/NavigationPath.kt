package com.ar.indoornavigation.model

import com.google.gson.annotations.SerializedName

data class NavigationPath(
    val id: String,
    val mapId: String,
    val startPOIId: String,
    val endPOIId: String,
    val waypoints: List<Vector3>,
    val totalDistance: Float,
    val estimatedTime: Int,
    val floorTransitions: List<FloorTransition> = emptyList()
)

data class FloorTransition(
    val fromFloor: Int,
    val toFloor: Int,
    val transitionPoint: Vector3,
    val transitionType: TransitionType
)

enum class TransitionType {
    STAIRS,
    ELEVATOR,
    ESCALATOR
}

data class NavigationState(
    val currentPosition: Vector3,
    val currentFloor: Int,
    val targetPOI: POI?,
    val path: NavigationPath?,
    val currentWaypointIndex: Int,
    val distanceToTarget: Float,
    val isNavigating: Boolean,
    val driftCompensation: Float
)