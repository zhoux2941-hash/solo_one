package com.ar.indoornavigation.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "floors")
data class FloorMap(
    @PrimaryKey val floorId: Int,
    val mapId: String,
    val floorName: String,
    val levelHeight: Float = 3.0f,
    val boundingBoxMinX: Float = 0f,
    val boundingBoxMinY: Float = 0f,
    val boundingBoxMinZ: Float = 0f,
    val boundingBoxMaxX: Float = 100f,
    val boundingBoxMaxY: Float = 10f,
    val boundingBoxMaxZ: Float = 100f,
    val isActive: Boolean = true
)