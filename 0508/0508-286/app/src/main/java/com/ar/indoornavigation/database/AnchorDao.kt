package com.ar.indoornavigation.database

import androidx.room.*
import com.ar.indoornavigation.model.AnchorData
import kotlinx.coroutines.flow.Flow

@Dao
interface AnchorDao {
    @Query("SELECT * FROM anchors WHERE mapId = :mapId")
    fun getAnchorsForMap(mapId: String): Flow<List<AnchorData>>

    @Query("SELECT * FROM anchors WHERE mapId = :mapId AND floorId = :floorId")
    fun getAnchorsForFloor(mapId: String, floorId: Int): Flow<List<AnchorData>>

    @Query("SELECT * FROM anchors WHERE id = :anchorId")
    suspend fun getAnchorById(anchorId: String): AnchorData?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnchor(anchor: AnchorData)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnchors(anchors: List<AnchorData>)

    @Update
    suspend fun updateAnchor(anchor: AnchorData)

    @Delete
    suspend fun deleteAnchor(anchor: AnchorData)

    @Query("DELETE FROM anchors WHERE mapId = :mapId")
    suspend fun deleteAnchorsForMap(mapId: String)
}