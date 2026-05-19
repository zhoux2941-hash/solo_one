package com.ar.indoornavigation.database

import androidx.room.*
import com.ar.indoornavigation.model.FloorMap
import kotlinx.coroutines.flow.Flow

@Dao
interface FloorDao {
    @Query("SELECT * FROM floors WHERE mapId = :mapId ORDER BY floorId ASC")
    fun getFloorsForMap(mapId: String): Flow<List<FloorMap>>

    @Query("SELECT * FROM floors WHERE mapId = :mapId AND floorId = :floorId")
    suspend fun getFloorById(mapId: String, floorId: Int): FloorMap?

    @Query("SELECT MAX(floorId) FROM floors WHERE mapId = :mapId")
    suspend fun getMaxFloorId(mapId: String): Int?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFloor(floor: FloorMap)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFloors(floors: List<FloorMap>)

    @Update
    suspend fun updateFloor(floor: FloorMap)

    @Delete
    suspend fun deleteFloor(floor: FloorMap)
}