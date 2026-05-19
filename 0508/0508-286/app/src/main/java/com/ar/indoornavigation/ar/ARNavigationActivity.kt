package com.ar.indoornavigation.ar

import android.graphics.Color
import android.opengl.GLSurfaceView
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.ar.indoornavigation.R
import com.ar.indoornavigation.database.AppDatabase
import com.ar.indoornavigation.model.POI
import com.ar.indoornavigation.model.POIType
import com.ar.indoornavigation.model.Vector3
import com.ar.indoornavigation.navigation.PathCalculator
import com.ar.indoornavigation.obstacle.ObstacleManager
import com.google.ar.core.*
import kotlinx.coroutines.launch
import java.util.*
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

class ARNavigationActivity : AppCompatActivity(), GLSurfaceView.Renderer {
    private lateinit var surfaceView: GLSurfaceView
    private lateinit var arSessionManager: ARSessionManager
    private lateinit var navigationGuideRenderer: NavigationGuideRenderer
    private lateinit var obstacleRenderer: ObstacleRenderer
    private lateinit var pathCalculator: PathCalculator
    private lateinit var db: AppDatabase

    private lateinit var btnCreateAnchor: Button
    private lateinit var btnAddPOI: Button
    private lateinit var btnSelectTarget: Button
    private lateinit var btnFloorUp: Button
    private lateinit var btnFloorDown: Button
    private lateinit var tvCurrentFloor: TextView
    private lateinit var tvDistance: TextView
    private lateinit var tvStatus: TextView
    private lateinit var tvQualityIndicator: TextView
    private lateinit var tvRecommendation: TextView
    private lateinit var tvAvoidanceStatus: TextView
    private lateinit var tvObstacleCount: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var qualityProgressBar: ProgressBar
    private lateinit var avoidanceProgressBar: ProgressBar
    private lateinit var layoutAvoidance: LinearLayout

    private val viewMatrix = FloatArray(16)
    private val projectionMatrix = FloatArray(16)

    private var currentMapId = UUID.randomUUID().toString()
    private var targetPOI: POI? = null
    private var isNavigating = false
    private var currentWarningLevel = ObstacleManager.WarningLevel.SAFE

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ar_navigation)

        initUI()
        initAR()
        initDatabase()
    }

    private fun initUI() {
        surfaceView = findViewById(R.id.surfaceView)
        btnCreateAnchor = findViewById(R.id.btnCreateAnchor)
        btnAddPOI = findViewById(R.id.btnAddPOI)
        btnSelectTarget = findViewById(R.id.btnSelectTarget)
        btnFloorUp = findViewById(R.id.btnFloorUp)
        btnFloorDown = findViewById(R.id.btnFloorDown)
        tvCurrentFloor = findViewById(R.id.tvCurrentFloor)
        tvDistance = findViewById(R.id.tvDistance)
        tvStatus = findViewById(R.id.tvStatus)
        tvQualityIndicator = findViewById(R.id.tvQualityIndicator)
        tvRecommendation = findViewById(R.id.tvRecommendation)
        tvAvoidanceStatus = findViewById(R.id.tvAvoidanceStatus)
        tvObstacleCount = findViewById(R.id.tvObstacleCount)
        progressBar = findViewById(R.id.progressBar)
        qualityProgressBar = findViewById(R.id.qualityProgressBar)
        avoidanceProgressBar = findViewById(R.id.avoidanceProgressBar)
        layoutAvoidance = findViewById(R.id.layoutAvoidance)

        surfaceView.setEGLContextClientVersion(2)
        surfaceView.setRenderer(this)
        surfaceView.renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY

        setupButtonListeners()
        setupTouchListener()
    }

    private fun setupButtonListeners() {
        btnCreateAnchor.setOnClickListener {
            tvStatus.text = "点击平面创建锚点"
        }

        btnAddPOI.setOnClickListener {
            showAddPOIDialog()
        }

        btnSelectTarget.setOnClickListener {
            showSelectTargetDialog()
        }

        btnFloorUp.setOnClickListener {
            val currentFloor = arSessionManager.getCurrentFloor()
            arSessionManager.setCurrentFloor(currentFloor + 1)
            updateFloorDisplay()
        }

        btnFloorDown.setOnClickListener {
            val currentFloor = arSessionManager.getCurrentFloor()
            if (currentFloor > 0) {
                arSessionManager.setCurrentFloor(currentFloor - 1)
                updateFloorDisplay()
            }
        }
    }

    private fun setupTouchListener() {
        surfaceView.setOnTouchListener { _, event ->
            if (event.action == MotionEvent.ACTION_UP) {
                handleTap(event.x, event.y)
            }
            true
        }
    }

    private fun handleTap(x: Float, y: Float) {
        val hitResults = arSessionManager.performHitTest(x, y)
        for (hit in hitResults) {
            val trackable = hit.trackable
            if (trackable is Plane && trackable.isPoseInPolygon(hit.hitPose)) {
                val anchorData = arSessionManager.createAnchor(hit, currentMapId)
                if (anchorData != null) {
                    lifecycleScope.launch {
                        db.anchorDao().insertAnchor(anchorData)
                    }
                    tvStatus.text = "锚点已创建"
                    Toast.makeText(this, "锚点创建成功", Toast.LENGTH_SHORT).show()
                }
                break
            }
        }
    }

    private fun initAR() {
        arSessionManager = ARSessionManager(this)
        navigationGuideRenderer = NavigationGuideRenderer(this)
        obstacleRenderer = ObstacleRenderer(this)
        pathCalculator = PathCalculator()

        if (!arSessionManager.createSession()) {
            Toast.makeText(this, "无法创建AR会话", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        arSessionManager.setOnPositionUpdateListener { position ->
            runOnUiThread {
                updatePositionDisplay(position)
            }
        }

        arSessionManager.setOnFloorChangedListener { oldFloor, newFloor ->
            runOnUiThread {
                tvCurrentFloor.text = "楼层: $newFloor"
                Toast.makeText(this, "已切换到 $newFloor 层", Toast.LENGTH_SHORT).show()
            }
        }

        arSessionManager.setOnDriftWarningListener { drift, state ->
            runOnUiThread {
                updateQualityDisplay(drift, state)
            }
        }

        arSessionManager.setOnAvoidanceStatusChangedListener { status ->
            runOnUiThread {
                updateAvoidanceDisplay(status)
            }
        }

        arSessionManager.setOnPathReplanListener { pathUpdate ->
            runOnUiThread {
                handlePathReplan(pathUpdate)
            }
        }
    }

    private fun initDatabase() {
        db = AppDatabase.getDatabase(this)
    }

    private fun updatePositionDisplay(position: Vector3) {
        if (isNavigating && targetPOI != null) {
            val distance = position.distanceTo(targetPOI!!.getPosition())
            tvDistance.text = "距离目标: ${String.format("%.1f", distance)}m"

            if (distance < 1.0f) {
                isNavigating = false
                navigationGuideRenderer.clearNavigation()
                tvStatus.text = "已到达目的地!"
                tvStatus.setTextColor(Color.GREEN)
                Toast.makeText(this, "导航完成!", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun updateQualityDisplay(drift: Float, state: VIOPositionManager.DriftState) {
        val driftPer10m = arSessionManager.getDriftPer100M() / 10

        when (state) {
            VIOPositionManager.DriftState.NORMAL -> {
                tvQualityIndicator.text = "定位质量: 优秀"
                tvQualityIndicator.setTextColor(Color.GREEN)
                qualityProgressBar.progress = 100
                qualityProgressBar.progressTintList = ColorStateList.valueOf(Color.GREEN)
                tvRecommendation.visibility = View.GONE
            }
            VIOPositionManager.DriftState.RECOVERING -> {
                tvQualityIndicator.text = "定位质量: 恢复中"
                tvQualityIndicator.setTextColor(Color.YELLOW)
                qualityProgressBar.progress = 75
                qualityProgressBar.progressTintList = ColorStateList.valueOf(Color.YELLOW)
                tvRecommendation.visibility = View.GONE
            }
            VIOPositionManager.DriftState.WARNING -> {
                tvQualityIndicator.text = "定位质量: 警告 (${String.format("%.2f", driftPer10m)}m/10m)"
                tvQualityIndicator.setTextColor(Color.parseColor("#FFA500"))
                qualityProgressBar.progress = 50
                qualityProgressBar.progressTintList = ColorStateList.valueOf(Color.parseColor("#FFA500"))
                
                tvRecommendation.text = arSessionManager.getUserRecommendation()
                tvRecommendation.visibility = View.VISIBLE
            }
            VIOPositionManager.DriftState.CRITICAL -> {
                tvQualityIndicator.text = "定位质量: 危险 (${String.format("%.2f", driftPer10m)}m/10m)"
                tvQualityIndicator.setTextColor(Color.RED)
                qualityProgressBar.progress = 25
                qualityProgressBar.progressTintList = ColorStateList.valueOf(Color.RED)
                
                tvRecommendation.text = arSessionManager.getUserRecommendation()
                tvRecommendation.visibility = View.VISIBLE
                
                tvStatus.text = "定位漂移严重，请重新扫描环境!"
                tvStatus.setTextColor(Color.RED)
            }
        }
    }

    private fun updateAvoidanceDisplay(status: ObstacleManager.AvoidanceStatus) {
        currentWarningLevel = status.warningLevel

        val obstacleCount = arSessionManager.getObstacleCount()
        tvObstacleCount.text = "障碍物: $obstacleCount"

        if (obstacleCount > 0) {
            layoutAvoidance.visibility = View.VISIBLE
        } else {
            layoutAvoidance.visibility = View.GONE
        }

        when (status.warningLevel) {
            ObstacleManager.WarningLevel.SAFE -> {
                tvAvoidanceStatus.text = "避障状态: 安全"
                tvAvoidanceStatus.setTextColor(Color.GREEN)
                avoidanceProgressBar.progress = 100
                avoidanceProgressBar.progressTintList = ColorStateList.valueOf(Color.GREEN)
            }
            ObstacleManager.WarningLevel.CAUTION -> {
                tvAvoidanceStatus.text = "避障状态: 注意"
                tvAvoidanceStatus.setTextColor(Color.YELLOW)
                avoidanceProgressBar.progress = 75
                avoidanceProgressBar.progressTintList = ColorStateList.valueOf(Color.YELLOW)
            }
            ObstacleManager.WarningLevel.WARNING -> {
                tvAvoidanceStatus.text = "避障状态: 警告 (路径受阻: ${String.format("%.0f", status.blockedPathPercentage * 100)}%)"
                tvAvoidanceStatus.setTextColor(Color.parseColor("#FFA500"))
                avoidanceProgressBar.progress = 50
                avoidanceProgressBar.progressTintList = ColorStateList.valueOf(Color.parseColor("#FFA500"))
            }
            ObstacleManager.WarningLevel.DANGER -> {
                tvAvoidanceStatus.text = "避障状态: 危险! 距离障碍物: ${String.format("%.2f", status.distanceToNearest ?: 0f)}m"
                tvAvoidanceStatus.setTextColor(Color.RED)
                avoidanceProgressBar.progress = 25
                avoidanceProgressBar.progressTintList = ColorStateList.valueOf(Color.RED)
            }
        }
    }

    private fun handlePathReplan(pathUpdate: PathCalculator.PathUpdate) {
        navigationGuideRenderer.setNavigationPath(pathUpdate.newPath)
        
        val message = when {
            pathUpdate.isEmergency -> "紧急避障！路径已重新规划"
            else -> "路径已优化 - 避开 ${pathUpdate.obstaclesAvoided} 个障碍物"
        }
        
        tvStatus.text = message
        tvStatus.setTextColor(if (pathUpdate.isEmergency) Color.RED else Color.YELLOW)
        
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun updateFloorDisplay() {
        tvCurrentFloor.text = "楼层: ${arSessionManager.getCurrentFloor()}"
    }

    private fun showAddPOIDialog() {
        val poiTypes = POIType.values()
        val typeNames = poiTypes.map { it.name }.toTypedArray()
        
        var selectedType = POIType.OTHER
        val builder = AlertDialog.Builder(this)
        builder.setTitle("添加POI")
        
        val input = EditText(this)
        input.hint = "输入POI名称"
        
        builder.setView(input)
        builder.setSingleChoiceItems(typeNames, 0) { _, which ->
            selectedType = poiTypes[which]
        }
        
        builder.setPositiveButton("添加") { _, _ ->
            val name = input.text.toString()
            if (name.isNotEmpty()) {
                addPOI(name, selectedType)
            }
        }
        builder.setNegativeButton("取消", null)
        builder.show()
    }

    private fun addPOI(name: String, type: POIType) {
        val position = arSessionManager.getCurrentPosition()
        val poi = POI(
            id = UUID.randomUUID().toString(),
            mapId = currentMapId,
            floorId = arSessionManager.getCurrentFloor(),
            name = name,
            type = type,
            positionX = position.x,
            positionY = position.y,
            positionZ = position.z
        )

        lifecycleScope.launch {
            db.poiDao().insertPOI(poi)
        }
        
        tvStatus.text = "POI '$name' 已添加"
        Toast.makeText(this, "POI添加成功", Toast.LENGTH_SHORT).show()
    }

    private fun showSelectTargetDialog() {
        lifecycleScope.launch {
            val pois = db.poiDao().getPOIsForMap(currentMapId).value ?: emptyList()
            
            if (pois.isEmpty()) {
                runOnUiThread {
                    Toast.makeText(this@ARNavigationActivity, "还没有POI，请先添加", Toast.LENGTH_SHORT).show()
                }
                return@launch
            }

            val poiNames = pois.map { "${it.name} (${it.type})" }.toTypedArray()
            
            runOnUiThread {
                AlertDialog.Builder(this@ARNavigationActivity)
                    .setTitle("选择目的地")
                    .setItems(poiNames) { _, which ->
                        targetPOI = pois[which]
                        startNavigation(pois[which], pois)
                    }
                    .show()
            }
        }
    }

    private fun startNavigation(target: POI, allPois: List<POI>) {
        isNavigating = true
        arSessionManager.startNavigation(target, allPois)
        
        val currentPath = arSessionManager.getCurrentPath()
        if (currentPath != null) {
            navigationGuideRenderer.setNavigationPath(currentPath)
            tvStatus.text = "导航到: ${target.name}"
            tvStatus.setTextColor(Color.WHITE)
            tvDistance.text = "距离: ${String.format("%.1f", currentPath.totalDistance)}m"
            
            Toast.makeText(this@ARNavigationActivity, "开始导航", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        navigationGuideRenderer.createOnGlThread()
        obstacleRenderer.createOnGlThread()
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        gl?.glViewport(0, 0, width, height)
    }

    override fun onDrawFrame(gl: GL10?) {
        gl?.glClear(GL10.GL_COLOR_BUFFER_BIT or GL10.GL_DEPTH_BUFFER_BIT)

        val camera = arSessionManager.update() ?: return

        if (camera.trackingState == TrackingState.TRACKING) {
            camera.getViewMatrix(viewMatrix, 0)
            camera.getProjectionMatrix(projectionMatrix, 0, 0.1f, 100.0f)

            obstacleRenderer.updateObstacles(arSessionManager.getObstacleManager())
            obstacleRenderer.draw(camera, viewMatrix, projectionMatrix, currentWarningLevel)

            if (isNavigating && targetPOI != null) {
                val currentPosition = arSessionManager.getCurrentPosition()
                navigationGuideRenderer.updateNavigation(currentPosition, targetPOI!!.getPosition())
                navigationGuideRenderer.draw(camera, viewMatrix, projectionMatrix)
            }
        } else if (camera.trackingState == TrackingState.PAUSED) {
            runOnUiThread {
                tvStatus.text = "追踪暂停: ${camera.trackingFailureReason}"
                tvStatus.setTextColor(Color.YELLOW)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        arSessionManager.resume()
        surfaceView.onResume()
    }

    override fun onPause() {
        super.onPause()
        arSessionManager.pause()
        surfaceView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        arSessionManager.destroy()
    }
}