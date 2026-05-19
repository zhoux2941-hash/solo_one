package com.ar.indoornavigation

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.ar.indoornavigation.ar.ARNavigationActivity
import com.ar.indoornavigation.databinding.ActivityMainBinding
import com.google.ar.core.ArCoreApk

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    
    private val CAMERA_PERMISSION_CODE = 1001
    private val REQUIRED_PERMISSIONS = mutableListOf(Manifest.permission.CAMERA).apply {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
    }.toTypedArray()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupButtons()
        checkARCoreAvailability()
    }

    private fun setupButtons() {
        binding.btnStartAR.setOnClickListener {
            if (hasAllPermissions()) {
                startARNavigation()
            } else {
                requestPermissions()
            }
        }

        binding.btnViewMaps.setOnClickListener {
            Toast.makeText(this, "地图列表功能开发中", Toast.LENGTH_SHORT).show()
        }

        binding.btnSettings.setOnClickListener {
            Toast.makeText(this, "设置功能开发中", Toast.LENGTH_SHORT).show()
        }
    }

    private fun checkARCoreAvailability() {
        val availability = ArCoreApk.getInstance().checkAvailability(this)
        when (availability) {
            ArCoreApk.Availability.SUPPORTED_INSTALLED -> {
                binding.tvARStatus.text = "ARCore 已就绪"
            }
            ArCoreApk.Availability.SUPPORTED_APK_TOO_OLD,
            ArCoreApk.Availability.SUPPORTED_NOT_INSTALLED -> {
                binding.tvARStatus.text = "需要安装/更新 ARCore"
                ArCoreApk.getInstance().requestInstall(this, true)
            }
            else -> {
                binding.tvARStatus.text = "设备不支持 ARCore"
                binding.btnStartAR.isEnabled = false
            }
        }
    }

    private fun hasAllPermissions(): Boolean {
        return REQUIRED_PERMISSIONS.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(
            this,
            REQUIRED_PERMISSIONS,
            CAMERA_PERMISSION_CODE
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            CAMERA_PERMISSION_CODE -> {
                if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    startARNavigation()
                } else {
                    Toast.makeText(this, "需要相机权限才能使用AR功能", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun startARNavigation() {
        val intent = Intent(this, ARNavigationActivity::class.java)
        startActivity(intent)
    }
}