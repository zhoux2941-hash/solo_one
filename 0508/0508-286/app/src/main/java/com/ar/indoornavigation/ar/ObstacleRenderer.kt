package com.ar.indoornavigation.ar

import android.content.Context
import android.opengl.GLES20
import com.ar.indoornavigation.model.Vector3
import com.ar.indoornavigation.obstacle.DepthPointCloudProcessor
import com.ar.indoornavigation.obstacle.ObstacleManager
import com.google.ar.core.Camera
import java.io.IOException
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

class ObstacleRenderer(private val context: Context) {
    private val COORDS_PER_VERTEX = 3
    private val VERTEX_STRIDE = COORDS_PER_VERTEX * 4

    private var obstacleProgram = 0
    private var safetyZoneProgram = 0
    private var predictedPathProgram = 0

    private var obstaclePositionHandle = 0
    private var obstacleMVPMatrixHandle = 0
    private var obstacleColorHandle = 0

    private var safetyZonePositionHandle = 0
    private var safetyZoneMVPMatrixHandle = 0
    private var safetyZoneColorHandle = 0

    private val STATIC_COLOR = floatArrayOf(1.0f, 0.5f, 0.0f, 0.6f)
    private val DYNAMIC_COLOR = floatArrayOf(1.0f, 0.0f, 0.0f, 0.7f)
    private val PEDESTRIAN_COLOR = floatArrayOf(1.0f, 0.0f, 1.0f, 0.7f)
    private val CART_COLOR = floatArrayOf(0.0f, 0.5f, 1.0f, 0.7f)
    private val SAFETY_ZONE_COLOR = floatArrayOf(1.0f, 0.0f, 0.0f, 0.2f)
    private val PREDICTED_PATH_COLOR = floatArrayOf(1.0f, 1.0f, 0.0f, 0.4f)

    private val obstacles = mutableListOf<ObstacleRenderData>()
    private var safetyZoneRadius = 1.0f

    data class ObstacleRenderData(
        val id: String,
        val center: Vector3,
        val size: Vector3,
        val velocity: Vector3,
        val isDynamic: Boolean,
        val type: DepthPointCloudProcessor.ObstacleType,
        val confidence: Float,
        val predictedPosition: Vector3?
    )

    fun createOnGlThread() {
        obstacleProgram = createGlProgram(
            "shaders/obstacle_vertex.glsl",
            "shaders/obstacle_fragment.glsl"
        )
        safetyZoneProgram = createGlProgram(
            "shaders/obstacle_vertex.glsl",
            "shaders/obstacle_fragment.glsl"
        )
        predictedPathProgram = createGlProgram(
            "shaders/obstacle_vertex.glsl",
            "shaders/obstacle_fragment.glsl"
        )

        obstaclePositionHandle = GLES20.glGetAttribLocation(obstacleProgram, "vPosition")
        obstacleMVPMatrixHandle = GLES20.glGetUniformLocation(obstacleProgram, "uMVPMatrix")
        obstacleColorHandle = GLES20.glGetUniformLocation(obstacleProgram, "uColor")

        safetyZonePositionHandle = GLES20.glGetAttribLocation(safetyZoneProgram, "vPosition")
        safetyZoneMVPMatrixHandle = GLES20.glGetUniformLocation(safetyZoneProgram, "uMVPMatrix")
        safetyZoneColorHandle = GLES20.glGetUniformLocation(safetyZoneProgram, "uColor")
    }

    private fun createGlProgram(vertexShaderFileName: String, fragmentShaderFileName: String): Int {
        val vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, readShaderFile(vertexShaderFileName))
        val fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, readShaderFile(fragmentShaderFileName))

        val program = GLES20.glCreateProgram()
        GLES20.glAttachShader(program, vertexShader)
        GLES20.glAttachShader(program, fragmentShader)
        GLES20.glLinkProgram(program)

        return program
    }

    private fun loadShader(type: Int, shaderCode: String): Int {
        val shader = GLES20.glCreateShader(type)
        GLES20.glShaderSource(shader, shaderCode)
        GLES20.glCompileShader(shader)
        return shader
    }

    private fun readShaderFile(fileName: String): String {
        return try {
            val inputStream: InputStream = context.assets.open(fileName)
            inputStream.bufferedReader().use { it.readText() }
        } catch (e: IOException) {
            "error"
        }
    }

    fun updateObstacles(obstacleManager: ObstacleManager) {
        obstacles.clear()

        for (obstacle in obstacleManager.getAllObstacles()) {
            val predictedPos = if (obstacle.isDynamic) {
                Vector3(
                    obstacle.currentPosition.x + obstacle.velocity.x * 1.0f,
                    obstacle.currentPosition.y + obstacle.velocity.y * 1.0f,
                    obstacle.currentPosition.z + obstacle.velocity.z * 1.0f
                )
            } else {
                null
            }

            obstacles.add(
                ObstacleRenderData(
                    id = obstacle.id,
                    center = obstacle.currentPosition,
                    size = obstacle.size,
                    velocity = obstacle.velocity,
                    isDynamic = obstacle.isDynamic,
                    type = obstacle.type,
                    confidence = obstacle.confidence,
                    predictedPosition = predictedPos
                )
            )
        }
    }

    fun draw(
        camera: Camera,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray,
        warningLevel: ObstacleManager.WarningLevel
    ) {
        for (obstacle in obstacles) {
            drawObstacleBox(obstacle, viewMatrix, projectionMatrix)
            drawSafetyZone(obstacle, viewMatrix, projectionMatrix)

            if (obstacle.isDynamic && obstacle.predictedPosition != null) {
                drawPredictedPath(obstacle, viewMatrix, projectionMatrix)
            }
        }
    }

    private fun drawObstacleBox(
        obstacle: ObstacleRenderData,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray
    ) {
        val color = getObstacleColor(obstacle)

        GLES20.glUseProgram(obstacleProgram)
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)

        val vertices = createBoxVertices(obstacle.center, obstacle.size)
        val vertexBuffer = createFloatBuffer(vertices)

        GLES20.glEnableVertexAttribArray(obstaclePositionHandle)
        GLES20.glVertexAttribPointer(
            obstaclePositionHandle,
            COORDS_PER_VERTEX,
            GLES20.GL_FLOAT,
            false,
            VERTEX_STRIDE,
            vertexBuffer
        )

        val modelMatrix = FloatArray(16)
        android.opengl.Matrix.setIdentityM(modelMatrix, 0)

        val MVPMatrix = FloatArray(16)
        android.opengl.Matrix.multiplyMM(MVPMatrix, 0, projectionMatrix, 0, viewMatrix, 0)
        android.opengl.Matrix.multiplyMM(MVPMatrix, 0, MVPMatrix, 0, modelMatrix, 0)

        GLES20.glUniformMatrix4fv(obstacleMVPMatrixHandle, 1, false, MVPMatrix, 0)
        GLES20.glUniform4fv(obstacleColorHandle, 1, color, 0)

        GLES20.glDrawArrays(GLES20.GL_TRIANGLES, 0, vertices.size / 3)

        GLES20.glDisableVertexAttribArray(obstaclePositionHandle)
        GLES20.glDisable(GLES20.GL_BLEND)
    }

    private fun drawSafetyZone(
        obstacle: ObstacleRenderData,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray
    ) {
        if (obstacle.confidence < 0.5f) return

        GLES20.glUseProgram(safetyZoneProgram)
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)

        val safetyRadius = max(obstacle.size.x, obstacle.size.z) / 2 + safetyZoneRadius
        val vertices = createCircleVertices(obstacle.center, safetyRadius)
        val vertexBuffer = createFloatBuffer(vertices)

        GLES20.glEnableVertexAttribArray(safetyZonePositionHandle)
        GLES20.glVertexAttribPointer(
            safetyZonePositionHandle,
            COORDS_PER_VERTEX,
            GLES20.GL_FLOAT,
            false,
            VERTEX_STRIDE,
            vertexBuffer
        )

        val MVPMatrix = FloatArray(16)
        android.opengl.Matrix.multiplyMM(MVPMatrix, 0, projectionMatrix, 0, viewMatrix, 0)

        GLES20.glUniformMatrix4fv(safetyZoneMVPMatrixHandle, 1, false, MVPMatrix, 0)
        GLES20.glUniform4fv(safetyZoneColorHandle, 1, SAFETY_ZONE_COLOR, 0)

        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_FAN, 0, vertices.size / 3)

        GLES20.glDisableVertexAttribArray(safetyZonePositionHandle)
        GLES20.glDisable(GLES20.GL_BLEND)
    }

    private fun drawPredictedPath(
        obstacle: ObstacleRenderData,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray
    ) {
        val predicted = obstacle.predictedPosition ?: return

        GLES20.glUseProgram(predictedPathProgram)
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)

        val vertices = createLineVertices(obstacle.center, predicted, 0.05f)
        val vertexBuffer = createFloatBuffer(vertices)

        GLES20.glEnableVertexAttribArray(safetyZonePositionHandle)
        GLES20.glVertexAttribPointer(
            safetyZonePositionHandle,
            COORDS_PER_VERTEX,
            GLES20.GL_FLOAT,
            false,
            VERTEX_STRIDE,
            vertexBuffer
        )

        val MVPMatrix = FloatArray(16)
        android.opengl.Matrix.multiplyMM(MVPMatrix, 0, projectionMatrix, 0, viewMatrix, 0)

        GLES20.glUniformMatrix4fv(safetyZoneMVPMatrixHandle, 1, false, MVPMatrix, 0)
        GLES20.glUniform4fv(safetyZoneColorHandle, 1, PREDICTED_PATH_COLOR, 0)

        GLES20.glDrawArrays(GLES20.GL_TRIANGLES, 0, vertices.size / 3)

        GLES20.glDisableVertexAttribArray(safetyZonePositionHandle)
        GLES20.glDisable(GLES20.GL_BLEND)
    }

    private fun createBoxVertices(center: Vector3, size: Vector3): FloatArray {
        val halfX = size.x / 2
        val halfY = size.y / 2
        val halfZ = size.z / 2

        return floatArrayOf(
            center.x - halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z - halfZ,
            center.x - halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z - halfZ,
            center.x - halfX, center.y + halfY, center.z - halfZ,

            center.x - halfX, center.y - halfY, center.z + halfZ,
            center.x + halfX, center.y - halfY, center.z + halfZ,
            center.x + halfX, center.y + halfY, center.z + halfZ,
            center.x - halfX, center.y - halfY, center.z + halfZ,
            center.x + halfX, center.y + halfY, center.z + halfZ,
            center.x - halfX, center.y + halfY, center.z + halfZ,

            center.x - halfX, center.y + halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z + halfZ,
            center.x - halfX, center.y + halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z + halfZ,
            center.x - halfX, center.y + halfY, center.z + halfZ,

            center.x - halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y - halfY, center.z + halfZ,
            center.x - halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y - halfY, center.z + halfZ,
            center.x - halfX, center.y - halfY, center.z + halfZ,

            center.x - halfX, center.y - halfY, center.z - halfZ,
            center.x - halfX, center.y + halfY, center.z - halfZ,
            center.x - halfX, center.y + halfY, center.z + halfZ,
            center.x - halfX, center.y - halfY, center.z - halfZ,
            center.x - halfX, center.y + halfY, center.z + halfZ,
            center.x - halfX, center.y - halfY, center.z + halfZ,

            center.x + halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z + halfZ,
            center.x + halfX, center.y - halfY, center.z - halfZ,
            center.x + halfX, center.y + halfY, center.z + halfZ,
            center.x + halfX, center.y - halfY, center.z + halfZ
        )
    }

    private fun createCircleVertices(center: Vector3, radius: Float): FloatArray {
        val segments = 32
        val vertices = mutableListOf<Float>()

        vertices.add(center.x)
        vertices.add(center.y + 0.01f)
        vertices.add(center.z)

        for (i in 0..segments) {
            val angle = 2 * PI * i / segments
            val x = center.x + radius * cos(angle).toFloat()
            val z = center.z + radius * sin(angle).toFloat()
            vertices.add(x)
            vertices.add(center.y + 0.01f)
            vertices.add(z)
        }

        return vertices.toFloatArray()
    }

    private fun createLineVertices(start: Vector3, end: Vector3, width: Float): FloatArray {
        val direction = end.subtract(start).normalize()
        val perpendicular = Vector3(-direction.z, 0f, direction.x).normalize()

        val halfWidth = width / 2

        val p1 = start.add(perpendicular.multiply(halfWidth))
        val p2 = start.subtract(perpendicular.multiply(halfWidth))
        val p3 = end.add(perpendicular.multiply(halfWidth))
        val p4 = end.subtract(perpendicular.multiply(halfWidth))

        return floatArrayOf(
            p1.x, p1.y + 0.01f, p1.z,
            p2.x, p2.y + 0.01f, p2.z,
            p3.x, p3.y + 0.01f, p3.z,
            p2.x, p2.y + 0.01f, p2.z,
            p4.x, p4.y + 0.01f, p4.z,
            p3.x, p3.y + 0.01f, p3.z
        )
    }

    private fun createFloatBuffer(vertices: FloatArray): FloatBuffer {
        return ByteBuffer.allocateDirect(vertices.size * 4).run {
            order(ByteOrder.nativeOrder())
            asFloatBuffer().apply {
                put(vertices)
                position(0)
            }
        }
    }

    private fun getObstacleColor(obstacle: ObstacleRenderData): FloatArray {
        return when (obstacle.type) {
            DepthPointCloudProcessor.ObstacleType.PEDESTRIAN -> PEDESTRIAN_COLOR
            DepthPointCloudProcessor.ObstacleType.CART -> CART_COLOR
            else -> if (obstacle.isDynamic) DYNAMIC_COLOR else STATIC_COLOR
        }
    }

    fun setSafetyZoneRadius(radius: Float) {
        safetyZoneRadius = radius
    }

    fun clear() {
        obstacles.clear()
    }
}