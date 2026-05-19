package com.ar.indoornavigation.database

import androidx.room.*
import com.ar.indoornavigation.model.MapData
import kotlinx.coroutines.flow.Flow

@Dao
interface MapDao {
    @Query("SELECT * FROM maps ORDER BY updatedAt DESC")
    fun getAllMaps(): Flow<List<MapData>>

    @Query("SELECT * FROM maps WHERE mapId = :mapId")
    suspend fun getMapById(mapId: String): MapData?

    @Query("SELECT * FROM maps WHERE isShared = 1")
    fun getSharedMaps(): Flow<List<MapData>>

    @Query("SELECT * FROM maps WHERE creatorId = :creatorId")
    fun getMapsByCreator(creatorId: String): Flow<List<MapData>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMap(map: MapData)

    @Update
    suspend fun updateMap(map: MapData)

    @Delete
    suspend fun deleteMap(map: MapData)
}