#pragma once

#include <cstdint>
#include <cstddef>
#include <vector>
#include <string>
#include <memory>
#include <functional>

#ifdef _WIN32
    #ifdef VE_EXPORTS
        #define VE_API __declspec(dllexport)
    #else
        #define VE_API __declspec(dllimport)
    #endif
#else
    #define VE_API __attribute__((visibility("default")))
#endif

namespace ve {

enum class PixelFormat {
    Unknown,
    RGBA,
    BGRA,
    YUV420P,
    NV12,
    NV21,
    P010LE,
    P016LE,
    YUV420P10LE,
    YUV420P16LE,
    RGBA16F,
    RGBA32F
};

enum class CodecID {
    H264,
    H265,
    VP9,
    AV1,
    AAC,
    MP3
};

enum class HDRType {
    SDR,
    HDR10,
    HDR10Plus,
    HLG,
    DolbyVision
};

enum class ColorPrimaries {
    BT709,
    BT2020,
    P3D65,
    Unknown
};

enum class TransferCharacteristics {
    BT1886,
    PQ,
    HLG,
    Linear,
    Unknown
};

enum class MatrixCoefficients {
    BT709,
    BT2020NCL,
    BT2020CL,
    Unknown
};

struct VE_API Size {
    int width;
    int height;
    
    Size() : width(0), height(0) {}
    Size(int w, int h) : width(w), height(h) {}
};

struct VE_API Rect {
    int x, y;
    int width, height;
    
    Rect() : x(0), y(0), width(0), height(0) {}
    Rect(int x_, int y_, int w, int h) : x(x_), y(y_), width(w), height(h) {}
};

struct VE_API Color {
    float r, g, b, a;
    
    Color() : r(0), g(0), b(0), a(1) {}
    Color(float r_, float g_, float b_, float a_ = 1.0f) : r(r_), g(g_), b(b_), a(a_) {}
    
    static Color White() { return Color(1, 1, 1, 1); }
    static Color Black() { return Color(0, 0, 0, 1); }
    static Color Red() { return Color(1, 0, 0, 1); }
    static Color Green() { return Color(0, 1, 0, 1); }
    static Color Blue() { return Color(0, 0, 1, 1); }
    static Color Transparent() { return Color(0, 0, 0, 0); }
};

struct VE_API Vec2 {
    float x, y;
    
    Vec2() : x(0), y(0) {}
    Vec2(float x_, float y_) : x(x_), y(y_) {}
};

struct VE_API Vec3 {
    float x, y, z;
    
    Vec3() : x(0), y(0), z(0) {}
    Vec3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}
};

struct VE_API ChromaticityCoordinate {
    float x;
    float y;
    
    ChromaticityCoordinate() : x(0), y(0) {}
    ChromaticityCoordinate(float x_, float y_) : x(x_), y(y_) {}
};

struct VE_API MasteringDisplayMetadata {
    ChromaticityCoordinate r;
    ChromaticityCoordinate g;
    ChromaticityCoordinate b;
    ChromaticityCoordinate white_point;
    float max_luminance;
    float min_luminance;
    
    MasteringDisplayMetadata()
        : max_luminance(1000.0f), min_luminance(0.01f) {}
    
    bool is_valid() const { return max_luminance > 0; }
};

struct VE_API ContentLightLevelInfo {
    uint16_t max_content_light_level;
    uint16_t max_pixel_average_light_level;
    
    ContentLightLevelInfo()
        : max_content_light_level(0), max_pixel_average_light_level(0) {}
    
    bool is_valid() const { return max_content_light_level > 0; }
};

struct VE_API HDR10PlusMetadata {
    int processing;
    std::vector<uint8_t> data;
    
    HDR10PlusMetadata() : processing(0) {}
    bool is_valid() const { return !data.empty(); }
};

struct VE_API DolbyVisionRPU {
    int profile;
    int level;
    std::vector<uint8_t> data;
    int64_t pts;
    
    DolbyVisionRPU() : profile(0), level(0), pts(0) {}
    bool is_valid() const { return !data.empty(); }
};

struct VE_API HDRMetadata {
    HDRType hdr_type;
    ColorPrimaries color_primaries;
    TransferCharacteristics transfer;
    MatrixCoefficients matrix_coeffs;
    int bit_depth;
    
    MasteringDisplayMetadata mastering_display;
    ContentLightLevelInfo cll;
    HDR10PlusMetadata hdr10_plus;
    DolbyVisionRPU dolby_vision;
    
    HDRMetadata()
        : hdr_type(HDRType::SDR)
        , color_primaries(ColorPrimaries::BT709)
        , transfer(TransferCharacteristics::BT1886)
        , matrix_coeffs(MatrixCoefficients::BT709)
        , bit_depth(8) {}
    
    bool is_hdr() const { return hdr_type != HDRType::SDR; }
};

struct VE_API VideoFrame {
    uint8_t* data[4];
    int linesize[4];
    int width;
    int height;
    PixelFormat format;
    int64_t pts;
    double timestamp;
    
    HDRMetadata hdr_metadata;
    
    VideoFrame();
    ~VideoFrame();
    void Release();
};

struct VE_API AudioFrame {
    uint8_t* data;
    int sample_count;
    int sample_rate;
    int channels;
    int64_t pts;
    double timestamp;
    
    AudioFrame();
    ~AudioFrame();
    void Release();
};

enum class TransitionType {
    None,
    Fade,
    Dissolve,
    SlideLeft,
    SlideRight,
    SlideUp,
    SlideDown,
    WipeLeft,
    WipeRight,
    Ripple,
    Zoom,
    Rotate,
    Cube,
    PageCurl
};

enum class FilterType {
    None,
    Brightness,
    Contrast,
    Saturation,
    GaussianBlur,
    Sharpen,
    Sepia,
    Vignette,
    ColorBalance,
    Hue
};

struct VE_API SpeedPoint {
    double time;
    float speed;
    
    SpeedPoint() : time(0), speed(1.0f) {}
    SpeedPoint(double t, float s) : time(t), speed(s) {}
};

struct VE_API TimeRemapPoint {
    double input_time;
    double output_time;
    
    TimeRemapPoint() : input_time(0), output_time(0) {}
    TimeRemapPoint(double i, double o) : input_time(i), output_time(o) {}
};

using ProgressCallback = std::function<void(float progress)>;
using ErrorCallback = std::function<void(int error_code, const char* message)>;

}
