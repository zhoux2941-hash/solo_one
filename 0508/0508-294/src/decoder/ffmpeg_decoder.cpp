#include "ve/decoder.h"
#include "ve/utils/logger.h"
#include <extern/ffmpeg/include/libavcodec/avcodec.h>
#include <extern/ffmpeg/include/libavformat/avformat.h>
#include <extern/ffmpeg/include/libavutil/avutil.h>
#include <extern/ffmpeg/include/libavutil/imgutils.h>
#include <extern/ffmpeg/include/libswscale/swscale.h>
#include <extern/ffmpeg/include/libswresample/swresample.h>

#pragma warning(push)
#pragma warning(disable: 4996)

namespace ve {

static ColorPrimaries ConvertColorPrimaries(int av_color_primaries) {
    switch (av_color_primaries) {
        case AVCOL_PRI_BT2020: return ColorPrimaries::BT2020;
        case AVCOL_PRI_SMPTE432: return ColorPrimaries::P3D65;
        case AVCOL_PRI_BT709: return ColorPrimaries::BT709;
        default: return ColorPrimaries::Unknown;
    }
}

static TransferCharacteristics ConvertTransfer(int av_transfer) {
    switch (av_transfer) {
        case AVCOL_TRC_SMPTE2084: return TransferCharacteristics::PQ;
        case AVCOL_TRC_ARIB_STD_B67: return TransferCharacteristics::HLG;
        case AVCOL_TRC_BT1886: return TransferCharacteristics::BT1886;
        case AVCOL_TRC_LINEAR: return TransferCharacteristics::Linear;
        default: return TransferCharacteristics::Unknown;
    }
}

static MatrixCoefficients ConvertMatrixCoeffs(int av_matrix) {
    switch (av_matrix) {
        case AVCOL_SPC_BT2020_NCL: return MatrixCoefficients::BT2020NCL;
        case AVCOL_SPC_BT2020_CL: return MatrixCoefficients::BT2020CL;
        case AVCOL_SPC_BT709: return MatrixCoefficients::BT709;
        default: return MatrixCoefficients::Unknown;
    }
}

class VideoDecoder::Impl {
public:
    Impl() : format_ctx_(nullptr), codec_ctx_(nullptr), sws_ctx_(nullptr),
             frame_(nullptr), packet_(nullptr), video_stream_index_(-1),
             audio_stream_index_(-1), duration_(0), framerate_(30),
             current_pts_(0), speed_(1.0f), hdr_metadata_() {}
    
    ~Impl() { Close(); }
    
    bool Open(const std::string& path) {
        VE_LOG_INFO("Opening video: %s", path.c_str());
        
        format_ctx_ = avformat_alloc_context();
        if (!format_ctx_) {
            VE_LOG_ERROR("Failed to allocate format context");
            return false;
        }
        
        if (avformat_open_input(&format_ctx_, path.c_str(), nullptr, nullptr) < 0) {
            VE_LOG_ERROR("Failed to open input file");
            return false;
        }
        
        if (avformat_find_stream_info(format_ctx_, nullptr) < 0) {
            VE_LOG_ERROR("Failed to find stream info");
            return false;
        }
        
        for (unsigned int i = 0; i < format_ctx_->nb_streams; i++) {
            AVStream* stream = format_ctx_->streams[i];
            
            if (stream->codecpar->codec_type == AVMEDIA_TYPE_VIDEO && video_stream_index_ < 0) {
                video_stream_index_ = i;
                AVCodec* codec = avcodec_find_decoder(stream->codecpar->codec_id);
                if (!codec) {
                    VE_LOG_ERROR("Video codec not found");
                    return false;
                }
                codec_ctx_ = avcodec_alloc_context3(codec);
                avcodec_parameters_to_context(codec_ctx_, stream->codecpar);
                if (avcodec_open2(codec_ctx_, codec, nullptr) < 0) {
                    VE_LOG_ERROR("Failed to open video codec");
                    return false;
                }
                
                size_.width = codec_ctx_->width;
                size_.height = codec_ctx_->height;
                framerate_ = av_q2d(stream->avg_frame_rate);
                if (framerate_ <= 0) framerate_ = 30.0;
                
                bit_depth_ = codec_ctx_->bits_per_raw_sample;
                if (bit_depth_ <= 0) bit_depth_ = 8;
                
                hdr_metadata_.bit_depth = bit_depth_;
                hdr_metadata_.color_primaries = ConvertColorPrimaries(codec_ctx_->color_primaries);
                hdr_metadata_.transfer = ConvertTransfer(codec_ctx_->color_trc);
                hdr_metadata_.matrix_coeffs = ConvertMatrixCoeffs(codec_ctx_->colorspace);
                
                DetectHDRType();
                ReadHDRMetadata(stream);
                
                AVDictionaryEntry* rotate_tag = av_dict_get(stream->metadata, "rotate", nullptr, 0);
                rotation_ = rotate_tag ? atoi(rotate_tag->value) : 0;
            }
            else if (stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO && audio_stream_index_ < 0) {
                audio_stream_index_ = i;
                AVCodec* audio_codec = avcodec_find_decoder(stream->codecpar->codec_id);
                if (audio_codec) {
                    audio_codec_ctx_ = avcodec_alloc_context3(audio_codec);
                    avcodec_parameters_to_context(audio_codec_ctx_, stream->codecpar);
                    avcodec_open2(audio_codec_ctx_, audio_codec, nullptr);
                }
            }
        }
        
        if (video_stream_index_ < 0) {
            VE_LOG_ERROR("No video stream found");
            return false;
        }
        
        duration_ = format_ctx_->duration / (double)AV_TIME_BASE;
        frame_ = av_frame_alloc();
        packet_ = av_packet_alloc();
        
        VE_LOG_INFO("Video opened: %dx%d, %.2f fps, %.2f sec, %d bit",
                   size_.width, size_.height, framerate_, duration_, bit_depth_);
        
        if (hdr_metadata_.is_hdr()) {
            const char* hdr_str = "Unknown";
            switch (hdr_metadata_.hdr_type) {
                case HDRType::HDR10: hdr_str = "HDR10"; break;
                case HDRType::HDR10Plus: hdr_str = "HDR10+"; break;
                case HDRType::HLG: hdr_str = "HLG"; break;
                case HDRType::DolbyVision: hdr_str = "Dolby Vision"; break;
                default: break;
            }
            VE_LOG_INFO("HDR format detected: %s", hdr_str);
        }
        
        return true;
    }
    
    void DetectHDRType() {
        bool is_dolby_vision = codec_ctx_->codec_id == AV_CODEC_ID_HEVC &&
                              (codec_ctx_->profile == 12 || codec_ctx_->profile == 2);
        
        if (is_dolby_vision) {
            hdr_metadata_.hdr_type = HDRType::DolbyVision;
            return;
        }
        
        if (hdr_metadata_.transfer == TransferCharacteristics::HLG) {
            hdr_metadata_.hdr_type = HDRType::HLG;
            return;
        }
        
        if (hdr_metadata_.transfer == TransferCharacteristics::PQ) {
            AVFrameSideData* hdr10_plus = av_frame_get_side_data(frame_, AV_FRAME_DATA_DYNAMIC_HDR_PLUS);
            if (hdr10_plus) {
                hdr_metadata_.hdr_type = HDRType::HDR10Plus;
            } else {
                hdr_metadata_.hdr_type = HDRType::HDR10;
            }
            return;
        }
        
        hdr_metadata_.hdr_type = HDRType::SDR;
    }
    
    void ReadHDRMetadata(AVStream* stream) {
        AVFrameSideData* mastering_data = av_frame_get_side_data(frame_, AV_FRAME_DATA_MASTERING_DISPLAY_METADATA);
        if (mastering_data) {
            AVMasteringDisplayMetadata* md = (AVMasteringDisplayMetadata*)mastering_data->data;
            
            if (md->has_primaries) {
                hdr_metadata_.mastering_display.r.x = av_q2d(md->display_primaries[0][0]);
                hdr_metadata_.mastering_display.r.y = av_q2d(md->display_primaries[0][1]);
                hdr_metadata_.mastering_display.g.x = av_q2d(md->display_primaries[1][0]);
                hdr_metadata_.mastering_display.g.y = av_q2d(md->display_primaries[1][1]);
                hdr_metadata_.mastering_display.b.x = av_q2d(md->display_primaries[2][0]);
                hdr_metadata_.mastering_display.b.y = av_q2d(md->display_primaries[2][1]);
            }
            
            if (md->has_white_point) {
                hdr_metadata_.mastering_display.white_point.x = av_q2d(md->white_point[0]);
                hdr_metadata_.mastering_display.white_point.y = av_q2d(md->white_point[1]);
            }
            
            if (md->has_luminance) {
                hdr_metadata_.mastering_display.max_luminance = av_q2d(md->max_luminance);
                hdr_metadata_.mastering_display.min_luminance = av_q2d(md->min_luminance);
            }
        }
        
        AVFrameSideData* cll_data = av_frame_get_side_data(frame_, AV_FRAME_DATA_CONTENT_LIGHT_LEVEL);
        if (cll_data) {
            AVContentLightMetadata* cll = (AVContentLightMetadata*)cll_data->data;
            hdr_metadata_.cll.max_content_light_level = cll->MaxCLL;
            hdr_metadata_.cll.max_pixel_average_light_level = cll->MaxFALL;
        }
        
        AVFrameSideData* hdr10_plus_data = av_frame_get_side_data(frame_, AV_FRAME_DATA_DYNAMIC_HDR_PLUS);
        if (hdr10_plus_data) {
            hdr_metadata_.hdr10_plus.data.assign(hdr10_plus_data->data, hdr10_plus_data->data + hdr10_plus_data->size);
        }
        
        size_t dv_metadata_size = 0;
        uint8_t* dv_metadata = av_stream_get_side_data(stream, AV_PKT_DATA_DOVI_CONF, &dv_metadata_size);
        if (dv_metadata && dv_metadata_size > 0) {
            hdr_metadata_.dolby_vision.data.assign(dv_metadata, dv_metadata + dv_metadata_size);
        }
    }
    
    void Close() {
        if (sws_ctx_) {
            sws_freeContext(sws_ctx_);
            sws_ctx_ = nullptr;
        }
        if (codec_ctx_) {
            avcodec_free_context(&codec_ctx_);
            codec_ctx_ = nullptr;
        }
        if (audio_codec_ctx_) {
            avcodec_free_context(&audio_codec_ctx_);
            audio_codec_ctx_ = nullptr;
        }
        if (frame_) {
            av_frame_free(&frame_);
            frame_ = nullptr;
        }
        if (packet_) {
            av_packet_free(&packet_);
            packet_ = nullptr;
        }
        if (format_ctx_) {
            avformat_close_input(&format_ctx_);
            format_ctx_ = nullptr;
        }
    }
    
    bool Seek(double time) {
        int64_t timestamp = (int64_t)(time * AV_TIME_BASE);
        if (avformat_seek_file(format_ctx_, -1, INT64_MIN, timestamp, INT64_MAX, 0) < 0) {
            return false;
        }
        avcodec_flush_buffers(codec_ctx_);
        if (audio_codec_ctx_) {
            avcodec_flush_buffers(audio_codec_ctx_);
        }
        current_pts_ = timestamp;
        return true;
    }
    
    bool DecodeFrame(VideoFrame* out_frame) {
        while (av_read_frame(format_ctx_, packet_) >= 0) {
            if (packet_->stream_index == video_stream_index_) {
                avcodec_send_packet(codec_ctx_, packet_);
                int ret = avcodec_receive_frame(codec_ctx_, frame_);
                if (ret == 0) {
                    ConvertFrame(out_frame);
                    current_pts_ = frame_->pts;
                    av_packet_unref(packet_);
                    return true;
                }
            }
            else if (packet_->stream_index == audio_stream_index_ && audio_codec_ctx_) {
                avcodec_send_packet(audio_codec_ctx_, packet_);
                AVFrame* audio_frame = av_frame_alloc();
                if (avcodec_receive_frame(audio_codec_ctx_, audio_frame) == 0) {
                    if (!pending_audio_frames_.empty()) {
                        pending_audio_frames_.push_back(audio_frame);
                    } else {
                        av_frame_free(&audio_frame);
                    }
                } else {
                    av_frame_free(&audio_frame);
                }
            }
            av_packet_unref(packet_);
        }
        return false;
    }
    
    void ConvertFrame(VideoFrame* out_frame) {
        if (!sws_ctx_) {
            sws_ctx_ = sws_getContext(
                codec_ctx_->width, codec_ctx_->height, codec_ctx_->pix_fmt,
                codec_ctx_->width, codec_ctx_->height, AV_PIX_FMT_RGBA,
                SWS_BILINEAR, nullptr, nullptr, nullptr);
        }
        
        out_frame->width = frame_->width;
        out_frame->height = frame_->height;
        out_frame->format = PixelFormat::RGBA;
        out_frame->pts = frame_->pts;
        
        AVFrame* rgba_frame = av_frame_alloc();
        av_image_alloc(rgba_frame->data, rgba_frame->linesize,
                      frame_->width, frame_->height, AV_PIX_FMT_RGBA, 1);
        
        sws_scale(sws_ctx_, frame_->data, frame_->linesize, 0, frame_->height,
                  rgba_frame->data, rgba_frame->linesize);
        
        int data_size = av_image_get_buffer_size(AV_PIX_FMT_RGBA, frame_->width, frame_->height, 1);
        out_frame->data[0] = new uint8_t[data_size];
        memcpy(out_frame->data[0], rgba_frame->data[0], data_size);
        out_frame->linesize[0] = rgba_frame->linesize[0];
        
        av_freep(&rgba_frame->data[0]);
        av_frame_free(&rgba_frame);
    }
    
    bool HasAudio() const {
        return audio_stream_index_ >= 0 && audio_codec_ctx_ != nullptr;
    }
    
    Size size_;
    double duration_;
    double framerate_;
    int rotation_;
    int bit_depth_;
    float speed_;
    int64_t current_pts_;
    HDRMetadata hdr_metadata_;
    
private:
    AVFormatContext* format_ctx_;
    AVCodecContext* codec_ctx_;
    AVCodecContext* audio_codec_ctx_;
    SwsContext* sws_ctx_;
    AVFrame* frame_;
    AVPacket* packet_;
    int video_stream_index_;
    int audio_stream_index_;
    std::vector<AVFrame*> pending_audio_frames_;
};

VideoDecoder::VideoDecoder() : impl_(std::make_unique<Impl>()) {}
VideoDecoder::~VideoDecoder() = default;

bool VideoDecoder::Open(const std::string& path) { return impl_->Open(path); }
void VideoDecoder::Close() { impl_->Close(); }
Size VideoDecoder::GetSize() const { return impl_->size_; }
double VideoDecoder::GetDuration() const { return impl_->duration_; }
double VideoDecoder::GetFramerate() const { return impl_->framerate_; }
int VideoDecoder::GetRotation() const { return impl_->rotation_; }
HDRType VideoDecoder::GetHDRType() const { return impl_->hdr_metadata_.hdr_type; }
const HDRMetadata& VideoDecoder::GetHDRMetadata() const { return impl_->hdr_metadata_; }
int VideoDecoder::GetBitDepth() const { return impl_->bit_depth_; }
bool VideoDecoder::IsHDR() const { return impl_->hdr_metadata_.is_hdr(); }
bool VideoDecoder::Seek(double time) { return impl_->Seek(time); }
bool VideoDecoder::DecodeFrame(VideoFrame* frame) { 
    bool result = impl_->DecodeFrame(frame);
    if (result) {
        frame->hdr_metadata = impl_->hdr_metadata_;
    }
    return result;
}
void VideoDecoder::SetSpeed(float speed) { impl_->speed_ = speed; }
float VideoDecoder::GetSpeed() const { return impl_->speed_; }
double VideoDecoder::GetCurrentTime() const { return impl_->current_pts_ / (double)AV_TIME_BASE; }
bool VideoDecoder::HasAudio() const { return impl_->HasAudio(); }
bool VideoDecoder::DecodeAudio(AudioFrame* frame) { return false; }

}

#pragma warning(pop)
