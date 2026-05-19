package com.ar.indoornavigation.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.ar.core.Anchor

@Entity(tableName = "anchors")
data class AnchorData(
    @PrimaryKey val id: String,
    val mapId: String,
    val floorId: Int,
    val positionX: Float,
    val positionY: Float,
    val positionZ: Float,
    val rotationX: Float,
    val rotationY: Float,
    val rotationZ: Float,
    val rotationW: Float,
    val cloudAnchorId: String? = null,
    val confidence: Float = 1.0f,
    val timestamp: Long = System.currentTimeMillis()
) {
    fun getPosition() = Vector3(positionX, positionY, positionZ)

    fun getRotation() = floatArrayOf(rotationX, rotationY, rotationZ, rotationW)
}