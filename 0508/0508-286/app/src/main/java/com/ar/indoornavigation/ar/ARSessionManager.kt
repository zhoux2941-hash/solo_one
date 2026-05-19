package com.ar.indoornavigation.ar

import android.content.Context
import android.util.Log
import com.ar.indoornavigation.model.AnchorData
import com.ar.indoornavigation.model.NavigationPath
import com.ar.indoornavigation.model.POI
import com.ar.indoornavigation.model.Vector3
import com.ar.indoornavigation.navigation.PathCalculator
import com.ar.indoornavigation.obstacle.ObstacleManager
import com.google.ar.core.*
import com.google.ar.core.exceptions.CameraNotAvailableException
import java.util.*

class ARSessionManager(private val context: Context) {
    private val TAG = "ARSessionManager"

    var session: Session? = null
        private set

    private var config: Config? = null
    private lateinit var vioManager: VIOPositionManager
    private lateinit var obstacleManager: ObstacleManager
    private lateinit var pathCalculator: PathCalculator

    private val anchors = mutableMapOf<String, Anchor>()
    private val anchorDataMap = mutableMapOf<String, AnchorData>()

    private var currentFloor = 0
    private val floorHeightThreshold = 3.0f

    private var isScanning = false
    private var isNavigating = false
    private var targetPOI: POI? = null

    private var onPositionUpdate: ((Vector3) -> Unit)? = null
    private var onAnchorCreated: ((String, AnchorData) -> Unit)? = null
    private var onFloorChanged: ((Int, Int) -> Unit)? = null
    private var onPlaneDetected: ((Plane) -> Unit)? = null
    private var onDriftWarning: ((Float, VIOPositionManager.DriftState) -> Unit)? = null
    private var onQualityUpdate: ((FeatureQualityChecker.QualityMetrics) -> Unit)? = null
    private var onAvoidanceStatusChanged: ((ObstacleManager.AvoidanceStatus) -> Unit)? = null
    private var onPathReplan: ((PathCalculator.PathUpdate) -> Unit)? = null

    private var lastFrameTime: Long = 0
    private val frameInterval: Long = 33

    private var isInitialized = false
    private var currentPath: NavigationPath? = null

    fun createSession(): Boolean {
        return try {
            session = Session(context)
            vioManager = VIOPositionManager(context)
            vioManager.initialize()
            obstacleManager = ObstacleManager()
            pathCalculator = PathCalculator()
            setupConfig()
            isInitialized = true
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create AR session", e)
            false
        }
    }

    private fun setupConfig() {
        session?.let { arSession ->
            config = Config(arSession).apply {
                updateMode = Config.UpdateMode.LATEST_CAMERA_IMAGE
                planeFindingMode = Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
                focusMode = Config.FocusMode.AUTO
                lightEstimationMode = Config.LightEstimationMode.ENVIRONMENTAL_HDR
                depthMode = Config.DepthMode.AUTOMATIC

                setCloudAnchorMode(Config.CloudAnchorMode.ENABLED)
            }

            arSession.configure(config)
        }
    }

    fun resume() {
        try {
            session?.resume()
        } catch (e: CameraNotAvailableException) {
            Log.e(TAG, "Camera not available", e)
        }
    }

    fun pause() {
        session?.pause()
    }

    fun update(): Camera? {
        val now = System.currentTimeMillis()
        if (now - lastFrameTime < frameInterval) {
            return null
        }
        lastFrameTime = now

        val frame = try {
            session?.update()
        } catch (e: Exception) {
            Log.e(TAG, "Error updating frame", e)
            null
        } ?: return null

        val camera = frame.camera

        if (camera.trackingState == TrackingState.TRACKING) {
            val position = vioManager.updatePosition(camera, frame)
            onPositionUpdate?.invoke(position)

            detectPlanes(frame)
            detectObstacles(frame, position)
            checkFloorChange(position)
            checkDriftAndQuality()

            if (isNavigating && currentPath != null) {
                checkAndReplanPath(position)
            }
        } else if (camera.trackingState == TrackingState.PAUSED) {
            handleTrackingPaused(camera)
        }

        return camera
    }

    private fun detectPlanes(frame: Frame) {
        session?.getAllTrackables(Plane::class.java)?.forEach { plane ->
            if (plane.trackingState == TrackingState.TRACKING) {
                onPlaneDetected?.invoke(plane)
                vioManager.addDetectedPlane(plane)
            }
        }
    }

    private fun detectObstacles(frame: Frame, currentPosition: Vector3) {
        obstacleManager.update(frame, currentPosition)

        currentPath?.let { path ->
            val avoidanceStatus = obstacleManager.getAvoidanceStatus(currentPosition, path.waypoints)
            onAvoidanceStatusChanged?.invoke(avoidanceStatus)
        }
    }

    private fun checkAndReplanPath(currentPosition: Vector3) {
        val path = currentPath ?: return
        val target = targetPOI ?: return

        val avoidanceStatus = obstacleManager.getAvoidanceStatus(currentPosition, path.waypoints)

        if (pathCalculator.needsReplan(currentPosition, avoidanceStatus)) {
            val floors = emptyList()
            val pois = emptyList<POI>()

            val pathUpdate = pathCalculator.replanPathWithObstacles(
                currentPosition,
                currentFloor,
                target,
                pois,
                floors,
                obstacleManager
            )

            if (pathUpdate != null) {
                currentPath = pathUpdate.newPath
                onPathReplan?.invoke(pathUpdate)
                Log.d(TAG, "Path replanned: ${pathUpdate.reason}, obstacles avoided: ${pathUpdate.obstaclesAvoided}")
            }
        }
    }

    private fun checkFloorChange(position: Vector3) {
        val expectedY = currentFloor * floorHeightThreshold
        val threshold = floorHeightThreshold * 0.6f

        val newFloor = when {
            position.y > expectedY + threshold -> currentFloor + 1
            position.y < expectedY - threshold && currentFloor > 0 -> currentFloor - 1
            else -> return
        }

        if (newFloor != currentFloor) {
            val oldFloor = currentFloor
            currentFloor = newFloor
            onFloorChanged?.invoke(oldFloor, newFloor)
            Log.d(TAG, "Floor changed from $oldFloor to $currentFloor")
        }
    }

    private fun checkDriftAndQuality() {
        val driftState = vioManager.getDriftState()

        if (driftState == VIOPositionManager.DriftState.WARNING ||
            driftState == VIOPositionManager.DriftState.CRITICAL) {
            onDriftWarning?.invoke(vioManager.getDriftPer100M(), driftState)
        }
    }

    private fun handleTrackingPaused(camera: Camera) {
        val cause = camera.trackingFailureReason
        Log.w(TAG, "Tracking paused: $cause")
        
        when (cause) {
            Camera.TrackingFailureReason.NONE -> {}
            Camera.TrackingFailureReason.STATE_INITIALIZING -> {
                Log.d(TAG, "ARCore is initializing")
            }
            Camera.TrackingFailureReason.EXCESSIVE_MOTION -> {
                Log.d(TAG, "Device moving too fast")
            }
            Camera.TrackingFailureReason.INSUFFICIENT_FEATURES -> {
                Log.d(TAG, "Not enough visual features - low texture environment")
            }
            Camera.TrackingFailureReason.CAMERA_UNAVAILABLE -> {
                Log.d(TAG, "Camera unavailable")
            }
        }
    }

    fun createAnchor(hitResult: HitResult, mapId: String): AnchorData? {
        val anchor = hitResult.createAnchor()
        val anchorId = UUID.randomUUID().toString()

        val pose = anchor.pose
        val translation = pose.translation
        val rotation = pose.rotationQuaternion

        val anchorData = AnchorData(
            id = anchorId,
            mapId = mapId,
            floorId = currentFloor,
            positionX = translation[0],
            positionY = translation[1],
            positionZ = translation[2],
            rotationX = rotation[0],
            rotationY = rotation[1],
            rotationZ = rotation[2],
            rotationW = rotation[3],
            confidence = 1.0f
        )

        anchors[anchorId] = anchor
        anchorDataMap[anchorId] = anchorData

        vioManager.addAnchorReference(
            anchorId,
            anchorData.getPosition(),
            anchorData.getPosition()
        )

        onAnchorCreated?.invoke(anchorId, anchorData)

        Log.d(TAG, "Anchor created: $anchorId at ${anchorData.getPosition()}")
        return anchorData
    }

    fun startNavigation(target: POI, pois: List<POI>, floors: List<*> = emptyList<Any>()) {
        targetPOI = target
        isNavigating = true
        
        val currentPosition = vioManager.getSmoothedPosition()
        
        currentPath = pathCalculator.calculatePath(
            startPosition = currentPosition,
            startFloor = currentFloor,
            targetPOI = target,
            pois = pois,
            floors = emptyList(),
            avoidStairs = false
        )
        
        Log.d(TAG, "Navigation started to: ${target.name}")
    }

    fun stopNavigation() {
        isNavigating = false
        targetPOI = null
        currentPath = null
        pathCalculator.clearCurrentPath()
        Log.d(TAG, "Navigation stopped")
    }

    fun getCurrentPath(): NavigationPath? = currentPath

    fun getCurrentPosition(): Vector3 {
        return vioManager.getSmoothedPosition()
    }

    fun getCurrentFloor(): Int = currentFloor

    fun setCurrentFloor(floor: Int) {
        currentFloor = floor
    }

    fun getDriftPer100M(): Float = vioManager.getDriftPer100M()

    fun getDriftState(): VIOPositionManager.DriftState = vioManager.getDriftState()

    fun getObstacleManager(): ObstacleManager = obstacleManager

    fun getUserRecommendation(): String = vioManager.getUserRecommendation()

    fun startScanning() {
        isScanning = true
    }

    fun stopScanning() {
        isScanning = false
    }

    fun isTrackingStable(): Boolean {
        return getDriftState() == VIOPositionManager.DriftState.NORMAL ||
               getDriftState() == VIOPositionManager.DriftState.RECOVERING
    }

    fun destroy() {
        anchors.values.forEach { it.detach() }
        anchors.clear()
        anchorDataMap.clear()
        
        if (this::vioManager.isInitialized) {
            vioManager.destroy()
        }
        
        session?.close()
        session = null
        isInitialized = false
    }

    fun setOnPositionUpdateListener(listener: (Vector3) -> Unit) {
        onPositionUpdate = listener
    }

    fun setOnAnchorCreatedListener(listener: (String, AnchorData) -> Unit) {
        onAnchorCreated = listener
    }

    fun setOnFloorChangedListener(listener: (Int, Int) -> Unit) {
        onFloorChanged = listener
    }

    fun setOnPlaneDetectedListener(listener: (Plane) -> Unit) {
        onPlaneDetected = listener
    }

    fun setOnDriftWarningListener(listener: (Float, VIOPositionManager.DriftState) -> Unit) {
        onDriftWarning = listener
    }

    fun setOnQualityUpdateListener(listener: (FeatureQualityChecker.QualityMetrics) -> Unit) {
        onQualityUpdate = listener
    }

    fun setOnAvoidanceStatusChangedListener(listener: (ObstacleManager.AvoidanceStatus) -> Unit) {
        onAvoidanceStatusChanged = listener
    }

    fun setOnPathReplanListener(listener: (PathCalculator.PathUpdate) -> Unit) {
        onPathReplan = listener
    }

    fun performHitTest(x: Float, y: Float): List<HitResult> {
        return try {
            session?.update()?.hitTest(x, y) ?: emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "Hit test error", e)
            emptyList()
        }
    }

    fun getAnchorCount(): Int = anchors.size

    fun getPlaneCount(): Int {
        return session?.getAllTrackables(Plane::class.java)
            ?.filter { it.trackingState == TrackingState.TRACKING }
            ?.size ?: 0
    }

    fun getObstacleCount(): Int = obstacleManager.getAllObstacles().size
}