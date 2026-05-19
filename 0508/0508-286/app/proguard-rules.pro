-keep class com.google.ar.core.** { *; }
-keepclassmembers class * extends com.google.ar.core.Session {
    public <init>(...);
}

-keepattributes Signature
-keepattributes *Annotation*
-keep class com.ar.indoornavigation.model.** { *; }

-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

-keep class androidx.room.** { *; }
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**