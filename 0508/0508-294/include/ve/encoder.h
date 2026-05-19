#pragma once

#include "ve/types.h"

namespace ve {

struct VE_API EncoderConfig {
    std::string output_path;
    Size size;
    double framerate;
    int bitrate;
    CodecID video_codec;
    CodecID audio_codec;
    int audio_sample_rate;
    int audio_channels;
    int audio_bitrate;
    
    HDRType output_hdr_type;
    HDRMetadata hdr_metadata;
    int output_bit_depth;
    bool enable_hdr10_plus;
    bool enable_dolby_vision;
    
    EncoderConfig()
        : size(1920, 1080)
        , framerate(30.0)
        , bitrate(5000000)
        , video_codec(CodecID::H264)
        , audio_codec(CodecID::AAC)
        , audio_sample_rate(44100)
        , audio_channels(2)
        , audio_bitrate(128000)
        , output_hdr_type(HDRType::SDR)
        , output_bit_depth(8)
        , enable_hdr10_plus(false)
        , enable_dolby_vision(false)
    {}
    
    void SetHDR10Defaults() {
        output_hdr_type = HDRType::HDR10;
        output_bit_depth = 10;
        video_codec = CodecID::H265;
        if (bitrate < 10000000) bitrate = 10000000;
        
        hdr_metadata.hdr_type = HDRType::HDR10;
        hdr_metadata.color_primaries = ColorPrimaries::BT2020;
        hdr_metadata.transfer = TransferCharacteristics::PQ;
        hdr_metadata.matrix_coeffs = MatrixCoefficients::BT2020NCL;
        hdr_metadata.bit_depth = 10;
        
        hdr_metadata.mastering_display.r = ChromaticityCoordinate(0.708f, 0.292f);
        hdr_metadata.mastering_display.g = ChromaticityCoordinate(0.170f, 0.797f);
        hdr_metadata.mastering_display.b = ChromaticityCoordinate(0.131f, 0.046f);
        hdr_metadata.mastering_display.white_point = ChromaticityCoordinate(0.3127f, 0.3290f);
        hdr_metadata.mastering_display.max_luminance = 1000.0f;
        hdr_metadata.mastering_display.min_luminance = 0.01f;
        
        hdr_metadata.cll.max_content_light_level = 1000;
        hdr_metadata.cll.max_pixel_average_light_level = 400;
    }
    
    void SetHLGDefaults() {
        output_hdr_type = HDRType::HLG;
        output_bit_depth = 10;
        video_codec = CodecID::H265;
        if (bitrate < 10000000) bitrate = 10000000;
        
        hdr_metadata.hdr_type = HDRType::HLG;
        hdr_metadata.color_primaries = ColorPrimaries::BT2020;
        hdr_metadata.transfer = TransferCharacteristics::HLG;
        hdr_metadata.matrix_coeffs = MatrixCoefficients::BT2020NCL;
        hdr_metadata.bit_depth = 10;
    }
    
    void SetDolbyVisionDefaults(int profile = 5) {
        output_hdr_type = HDRType::DolbyVision;
        output_bit_depth = 10;
        video_codec = CodecID::H265;
        enable_dolby_vision = true;
        if (bitrate < 12000000) bitrate = 12000000;
        
        hdr_metadata.hdr_type = HDRType::DolbyVision;
        hdr_metadata.color_primaries = ColorPrimaries::BT2020;
        hdr_metadata.transfer = TransferCharacteristics::PQ;
        hdr_metadata.matrix_coeffs = MatrixCoefficients::BT2020NCL;
        hdr_metadata.bit_depth = 10;
        hdr_metadata.dolby_vision.profile = profile;
    }
};

class VE_API VideoEncoder {
public:
    VideoEncoder();
    ~VideoEncoder();
    
    bool Open(const EncoderConfig& config);
    void Close();
    
    bool EncodeVideoFrame(const VideoFrame* frame);
    bool EncodeAudioFrame(const AudioFrame* frame);
    
    bool Flush();
    
    int64_t GetVideoFrameCount() const;
    int64_t GetAudioFrameCount() const;
    
    const EncoderConfig& GetConfig() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

}
