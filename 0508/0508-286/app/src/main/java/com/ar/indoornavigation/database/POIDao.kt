package com.ar.indoornavigation.database

import androidx.room.*
import com.ar.indoornavigation.model.POI
import com.ar.indoornavigation.model.POIType
import kotlinx.coroutines.flow.Flow

@Dao
interface POIDao {
    @Query("SELECT * FROM pois WHERE mapId = :mapId")
    fun getPOIsForMap(mapId: String): Flow<List<POI>>

    @Query("SELECT * FROM pois WHERE mapId = :mapId AND floorId = :floorId")
    fun getPOIsForFloor(mapId: String, floorId: Int): Flow<List<POI>>

    @Query("SELECT * FROM pois WHERE mapId = :mapId AND type = :type")
    fun getPOIsByType(mapId: String, type: POIType): Flow<List<POI>>

    @Query("SELECT * FROM pois WHERE id = :poiId")
    suspend fun getPOIById(poiId: String): POI?

    @Query("SELECT * FROM pois WHERE name LIKE '%' || :query || '%' AND mapId = :mapId")
    suspend fun searchPOIs(mapId: String, query: String): List<POI>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPOI(poi: POI)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPOIs(pois: List<POI>)

    @Update
    suspend fun updatePOI(poi: POI)

    @Delete
    suspend fun deletePOI(poi: POI)

    @Query("DELETE FROM pois WHERE mapId = :mapId")
    suspend fun deletePOIsForMap(mapId: String)
}