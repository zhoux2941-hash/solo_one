package com.ar.indoornavigation.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "maps")
data class MapData(
    @PrimaryKey val mapId: String,
    val name: String,
    val description: String = "",
    val creatorId: String,
    val isShared: Boolean = false,
    val sharedWith: List<String> = emptyList(),
    val floorCount: Int = 1,
    val baseFloorId: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val version: Int = 1
)