# Keep JNI interfaces
-keep class com.mediapipe.handtracking.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# OpenCV
-keep class org.opencv.** { *; }
-dontwarn org.opencv.**

# MediaPipe
-keep class com.google.mediapipe.** { *; }
-dontwarn com.google.mediapipe.**
