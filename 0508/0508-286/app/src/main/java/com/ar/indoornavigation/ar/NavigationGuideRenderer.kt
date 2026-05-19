package com.ar.indoornavigation.ar

import android.content.Context
import android.opengl.GLES20
import com.ar.indoornavigation.model.NavigationPath
import com.ar.indoornavigation.model.Vector3
import com.google.ar.core.Camera
import java.io.IOException
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.ShortBuffer
import kotlin.math.*

class NavigationGuideRenderer(private val context: Context) {
    private val COORDS_PER_VERTEX = 3
    private val VERTEX_STRIDE = COORDS_PER_VERTEX * 4

    private var arrowProgram = 0
    private var pathProgram = 0

    private var arrowPositionHandle = 0
    private var arrowMVPMatrixHandle = 0
    private var arrowColorHandle = 0

    private var pathPositionHandle = 0
    private var pathMVPMatrixHandle = 0
    private var pathColorHandle = 0

    private val arrowVertices = FloatArray(18)
    private val arrowBuffer: FloatBuffer
    private val arrowColors = floatArrayOf(0.298f, 0.686f, 0.314f, 1.0f)

    private var pathVertices = FloatArray(0)
    private var pathBuffer: FloatBuffer? = null
    private val pathColor = floatArrayOf(0.129f, 0.588f, 0.953f, 1.0f)

    private var currentPath: NavigationPath? = null
    private var currentWaypointIndex = 0
    private var arrowPosition = Vector3.zero()
    private var arrowRotation = 0f

    private val PATH_WIDTH = 0.05f
    private val ARROW_SCALE = 0.3f

    init {
        ByteBuffer.allocateDirect(arrowVertices.size * 4).run {
            order(ByteOrder.nativeOrder())
            arrowBuffer = asFloatBuffer()
        }
    }

    fun createOnGlThread() {
        arrowProgram = createGlProgram(
            "shaders/arrow_vertex.glsl",
            "shaders/arrow_fragment.glsl"
        )
        pathProgram = createGlProgram(
            "shaders/path_vertex.glsl",
            "shaders/path_fragment.glsl"
        )

        arrowPositionHandle = GLES20.glGetAttribLocation(arrowProgram, "vPosition")
        arrowMVPMatrixHandle = GLES20.glGetUniformLocation(arrowProgram, "uMVPMatrix")
        arrowColorHandle = GLES20.glGetUniformLocation(arrowProgram, "uColor")

        pathPositionHandle = GLES20.glGetAttribLocation(pathProgram, "vPosition")
        pathMVPMatrixHandle = GLES20.glGetUniformLocation(pathProgram, "uMVPMatrix")
        pathColorHandle = GLES20.glGetUniformLocation(pathProgram, "uColor")
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

    fun setNavigationPath(path: NavigationPath) {
        currentPath = path
        currentWaypointIndex = 0
        updatePathGeometry()
    }

    fun updateNavigation(currentPosition: Vector3, targetPosition: Vector3) {
        if (currentPath == null) return

        val waypoints = currentPath!!.waypoints
        if (waypoints.isEmpty()) return

        while (currentWaypointIndex < waypoints.size - 1) {
            val nextWaypoint = waypoints[currentWaypointIndex + 1]
            if (currentPosition.distanceTo(nextWaypoint) < 0.5f) {
                currentWaypointIndex++
            } else {
                break
            }
        }

        val targetWaypoint = waypoints[currentWaypointIndex]
        arrowPosition = Vector3(
            currentPosition.x,
            currentPosition.y + 0.2f,
            currentPosition.z
        )

        val direction = targetWaypoint.subtract(currentPosition).normalize()
        arrowRotation = atan2(direction.z, direction.x) * (180f / PI)
    }

    private fun updatePathGeometry() {
        val waypoints = currentPath?.waypoints ?: return
        if (waypoints.size < 2) return

        val vertices = mutableListOf<Float>()

        for (i in 0 until waypoints.size - 1) {
            val start = waypoints[i]
            val end = waypoints[i + 1]

            val direction = end.subtract(start).normalize()
            val perpendicular = Vector3(-direction.z, 0f, direction.x).normalize()

            val halfWidth = PATH_WIDTH / 2f

            val p1 = start.add(perpendicular.multiply(halfWidth))
            val p2 = start.subtract(perpendicular.multiply(halfWidth))
            val p3 = end.add(perpendicular.multiply(halfWidth))
            val p4 = end.subtract(perpendicular.multiply(halfWidth))

            vertices.addAll(listOf(p1.x, p1.y, p1.z))
            vertices.addAll(listOf(p2.x, p2.y, p2.z))
            vertices.addAll(listOf(p3.x, p3.y, p3.z))
            vertices.addAll(listOf(p2.x, p2.y, p2.z))
            vertices.addAll(listOf(p4.x, p4.y, p4.z))
            vertices.addAll(listOf(p3.x, p3.y, p3.z))
        }

        pathVertices = vertices.toFloatArray()
        ByteBuffer.allocateDirect(pathVertices.size * 4).run {
            order(ByteOrder.nativeOrder())
            pathBuffer = asFloatBuffer()
            pathBuffer?.put(pathVertices)
            pathBuffer?.position(0)
        }
    }

    fun draw(camera: Camera, viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        drawPath(viewMatrix, projectionMatrix)
        drawArrow(viewMatrix, projectionMatrix)
    }

    private fun drawPath(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        if (pathBuffer == null || currentPath == null) return

        GLES20.glUseProgram(pathProgram)

        GLES20.glEnableVertexAttribArray(pathPositionHandle)
        GLES20.glVertexAttribPointer(
            pathPositionHandle,
            COORDS_PER_VERTEX,
            GLES20.GL_FLOAT,
            false,
            VERTEX_STRIDE,
            pathBuffer
        )

        val MVPMatrix = FloatArray(16)
        android.opengl.Matrix.multiplyMM(MVPMatrix, 0, projectionMatrix, 0, viewMatrix, 0)
        GLES20.glUniformMatrix4fv(pathMVPMatrixHandle, 1, false, MVPMatrix, 0)

        GLES20.glUniform4fv(pathColorHandle, 1, pathColor, 0)

        GLES20.glDrawArrays(GLES20.GL_TRIANGLES, 0, pathVertices.size / 3)

        GLES20.glDisableVertexAttribArray(pathPositionHandle)
    }

    private fun drawArrow(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        if (currentPath == null) return

        GLES20.glUseProgram(arrowProgram)

        updateArrowGeometry()

        GLES20.glEnableVertexAttribArray(arrowPositionHandle)
        arrowBuffer.rewind()
        GLES20.glVertexAttribPointer(
            arrowPositionHandle,
            COORDS_PER_VERTEX,
            GLES20.GL_FLOAT,
            false,
            VERTEX_STRIDE,
            arrowBuffer
        )

        val modelMatrix = FloatArray(16)
        android.opengl.Matrix.setIdentityM(modelMatrix, 0)
        android.opengl.Matrix.translateM(modelMatrix, 0, arrowPosition.x, arrowPosition.y, arrowPosition.z)
        android.opengl.Matrix.rotateM(modelMatrix, 0, arrowRotation, 0f, 1f, 0f)
        android.opengl.Matrix.scaleM(modelMatrix, 0, ARROW_SCALE, ARROW_SCALE, ARROW_SCALE)

        val MVMatrix = FloatArray(16)
        android.opengl.Matrix.multiplyMM(MVMatrix, 0, viewMatrix, 0, modelMatrix, 0)

        val MVPMatrix = FloatArray(16)
        android.opengl.Matrix.multiplyMM(MVPMatrix, 0, projectionMatrix, 0, MVMatrix, 0)

        GLES20.glUniformMatrix4fv(arrowMVPMatrixHandle, 1, false, MVPMatrix, 0)
        GLES20.glUniform4fv(arrowColorHandle, 1, arrowColors, 0)

        GLES20.glDrawArrays(GLES20.GL_TRIANGLES, 0, 6)

        GLES20.glDisableVertexAttribArray(arrowPositionHandle)
    }

    private fun updateArrowGeometry() {
        val vertices = floatArrayOf(
            0.0f, 0.0f, 0.5f,
            -0.3f, 0.0f, -0.5f,
            0.3f, 0.0f, -0.5f,
            0.0f, 0.2f, 0.3f,
            -0.2f, 0.0f, -0.3f,
            0.2f, 0.0f, -0.3f
        )

        arrowBuffer.rewind()
        arrowBuffer.put(vertices)
        arrowBuffer.position(0)
    }

    fun clearNavigation() {
        currentPath = null
        currentWaypointIndex = 0
        pathVertices = FloatArray(0)
        pathBuffer = null
    }
}