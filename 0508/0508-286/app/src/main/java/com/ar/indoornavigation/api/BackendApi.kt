package com.ar.indoornavigation.api

import com.ar.indoornavigation.model.*
import retrofit2.Call
import retrofit2.http.*

interface BackendApi {
    @POST("api/maps")
    suspend fun createMap(@Body mapData: MapData): retrofit2.Response<MapData>

    @GET("api/maps/{mapId}")
    suspend fun getMap(@Path("mapId") mapId: String): retrofit2.Response<MapData>

    @PUT("api/maps/{mapId}")
    suspend fun updateMap(@Path("mapId") mapId: String, @Body mapData: MapData): retrofit2.Response<MapData>

    @DELETE("api/maps/{mapId}")
    suspend fun deleteMap(@Path("mapId") mapId: String): retrofit2.Response<Unit>

    @GET("api/maps/shared")
    suspend fun getSharedMaps(): retrofit2.Response<List<MapData>>

    @POST("api/maps/{mapId}/share")
    suspend fun shareMap(@Path("mapId") mapId: String, @Body shareRequest: ShareRequest): retrofit2.Response<Unit>

    @POST("api/maps/{mapId}/anchors")
    suspend fun createAnchor(@Path("mapId") mapId: String, @Body anchorData: AnchorData): retrofit2.Response<AnchorData>

    @GET("api/maps/{mapId}/anchors")
    suspend fun getAnchors(@Path("mapId") mapId: String): retrofit2.Response<List<AnchorData>>

    @POST("api/maps/{mapId}/pois")
    suspend fun createPOI(@Path("mapId") mapId: String, @Body poi: POI): retrofit2.Response<POI>

    @GET("api/maps/{mapId}/pois")
    suspend fun getPOIs(@Path("mapId") mapId: String): retrofit2.Response<List<POI>>

    @POST("api/maps/{mapId}/floors")
    suspend fun createFloor(@Path("mapId") mapId: String, @Body floor: FloorMap): retrofit2.Response<FloorMap>

    @GET("api/maps/{mapId}/floors")
    suspend fun getFloors(@Path("mapId") mapId: String): retrofit2.Response<List<FloorMap>>

    @POST("api/maps/{mapId}/navigate")
    suspend fun calculatePath(
        @Path("mapId") mapId: String,
        @Body navigationRequest: NavigationRequest
    ): retrofit2.Response<NavigationPath>

    @GET("api/maps/{mapId}/sync")
    suspend fun syncMapData(@Path("mapId") mapId: String): retrofit2.Response<MapSyncData>

    @POST("api/maps/{mapId}/sync")
    suspend fun uploadMapData(@Path("mapId") mapId: String, @Body syncData: MapSyncData): retrofit2.Response<Unit>
}

data class ShareRequest(
    val sharedWith: List<String>
)

data class NavigationRequest(
    val startPosition: Vector3,
    val startFloor: Int,
    val targetPOIId: String,
    val avoidStairs: Boolean = false
)

data class MapSyncData(
    val map: MapData,
    val floors: List<FloorMap>,
    val anchors: List<AnchorData>,
    val pois: List<POI>,
    val version: Int
)