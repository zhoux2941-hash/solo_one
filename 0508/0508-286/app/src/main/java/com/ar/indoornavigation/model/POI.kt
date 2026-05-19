package com.ar.indoornavigation.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

enum class POIType {
    MEETING_ROOM,
    WORKSTATION,
    RESTROOM,
    ELEVATOR,
    STAIRS,
    EXIT,
    OTHER
}

@Entity(tableName = "pois")
data class POI(
    @PrimaryKey val id: String,
    val mapId: String,
    val floorId: Int,
    val name: String,
    val type: POIType,
    val positionX: Float,
    val positionY: Float,
    val positionZ: Float,
    val description: String = "",
    val anchorId: String? = null,
    val timestamp: Long = System.currentTimeMillis()
) {
    fun getPosition() = Vector3(positionX, positionY, positionZ)
}

data class POIWithDistance(
    val poi: POI,
    val distance: Float
)