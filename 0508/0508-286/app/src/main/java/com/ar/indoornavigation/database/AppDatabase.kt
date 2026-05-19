package com.ar.indoornavigation.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import android.content.Context
import com.ar.indoornavigation.model.AnchorData
import com.ar.indoornavigation.model.FloorMap
import com.ar.indoornavigation.model.MapData
import com.ar.indoornavigation.model.POI

@Database(
    entities = [AnchorData::class, POI::class, FloorMap::class, MapData::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun anchorDao(): AnchorDao
    abstract fun poiDao(): POIDao
    abstract fun floorDao(): FloorDao
    abstract fun mapDao(): MapDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "ar_navigation_db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}