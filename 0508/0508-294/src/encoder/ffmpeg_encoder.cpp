#include "ve/encoder.h"
#include "ve/utils/logger.h"
#include <extern/ffmpeg/include/libavcodec/avcodec.h>
#include <extern/ffmpeg/include/libavformat/avformat.h>
#include <extern/ffmpeg/include/libavutil/avutil.h>
#include <extern/ffmpeg/include/libavutil/opt.h>
#include <extern/ffmpeg/include/libavutil/mastering_display_metadata.h>
#include <extern/ffmpeg/include/libavutil/content_light_level.h>
#include <extern/ffmpeg/include/libavutil/dovi_meta.h>
#include <extern/ffmpeg/include/libavutil/hdr_dynamic_metadata.h>
#include <extern/ffmpeg/include/libswscale/swscale.h>
#include <extern/ffmpeg/include/libswresample/swresample.h>

#pragma warning(push)
#pragma warning(disable: 4996)

namespace ve {

class VideoEncoder::Impl {
public:
    Impl() : format_ctx_(nullptr), video_codec_ctx_(nullptr),
             audio_codec_ctx_(nullptr), sws_ctx_(nullptr), swr_ctx_(nullptr),
             video_frame_(nullptr), audio_frame_(nullptr), packet_(nullptr),
             video_stream_(nullptr), audio_stream_(nullptr),
             video_frame_count_(0), audio_frame_count_(0) {}
    
    ~Impl() { Close(); }
    
    bool Open(const EncoderConfig& config) {
        config_ = config;
        
        VE_LOG_INFO("Opening encoder: %dx%d @ %.1f fps, bitrate: %d, HDR: %s",
                   config.size.width, config.size.height,
                   config.framerate, config.bitrate,
                   config.output_hdr_type != HDRType::SDR ? "enabled" : "disabled");
        
        avformat_alloc_output_context2(&format_ctx_, nullptr, nullptr,
                                       config.output_path.c_str());
        if (!format_ctx_) {
            VE_LOG_ERROR("Failed to create output context");
            return false;
        }
        
        if (!OpenVideoCodec()) {
            VE_LOG_ERROR("Failed to open video codec");
            return false;
        }
        
        if (!OpenAudioCodec()) {
            VE_LOG_ERROR("Failed to open audio codec");
            return false;
        }
        
        if (!(format_ctx_->oformat->flags & AVFMT_NOFILE)) {
            if (avio_open(&format_ctx_->pb, config.output_path.c_str(),
                          AVIO_FLAG_WRITE) < 0) {
                VE_LOG_ERROR("Failed to open output file");
                return false;
            }
        }
        
        if (avformat_write_header(format_ctx_, nullptr) < 0) {
            VE_LOG_ERROR("Failed to write header");
            return false;
        }
        
        VE_LOG_INFO("Encoder opened successfully");
        return true;
    }
    
    bool OpenVideoCodec() {
        AVCodecID codec_id = AV_CODEC_ID_H264;
        const char* codec_name = "libx264";
        
        if (config_.video_codec == CodecID::H265) {
            codec_id = AV_CODEC_ID_HEVC;
            codec_name = "libx265";
        }
        
        AVCodec* codec = avcodec_find_encoder(codec_id);
        if (!codec) {
            codec = avcodec_find_encoder_by_name(codec_name);
        }
        if (!codec) {
            VE_LOG_ERROR("Video codec not found: %s", codec_name);
            return false;
        }
        
        video_codec_ctx_ = avcodec_alloc_context3(codec);
        if (!video_codec_ctx_) return false;
        
        video_codec_ctx_->width = config_.size.width;
        video_codec_ctx_->height = config_.size.height;
        video_codec_ctx_->time_base = {1, (int)config_.framerate};
        video_codec_ctx_->framerate = {(int)config_.framerate, 1};
        video_codec_ctx_->bit_rate = config_.bitrate;
        video_codec_ctx_->gop_size = 12;
        video_codec_ctx_->max_b_frames = 2;
        
        if (config_.output_hdr_type == HDRType::HDR10 ||
            config_.output_hdr_type == HDRType::HDR10Plus ||
            config_.output_hdr_type == HDRType::DolbyVision) {
            video_codec_ctx_->pix_fmt = AV_PIX_FMT_YUV420P10LE;
            video_codec_ctx_->color_range = AVCOL_RANGE_MPEG;
            video_codec_ctx_->color_primaries = AVCOL_PRI_BT2020;
            video_codec_ctx_->color_trc = AVCOL_TRC_SMPTE2084;
            video_codec_ctx_->colorspace = AVCOL_SPC_BT2020_NCL;
            video_codec_ctx_->profile = FF_PROFILE_HEVC_MAIN_10;
        } else if (config_.output_hdr_type == HDRType::HLG) {
            video_codec_ctx_->pix_fmt = AV_PIX_FMT_YUV420P10LE;
            video_codec_ctx_->color_range = AVCOL_RANGE_MPEG;
            video_codec_ctx_->color_primaries = AVCOL_PRI_BT2020;
            video_codec_ctx_->color_trc = AVCOL_TRC_ARIB_STD_B67;
            video_codec_ctx_->colorspace = AVCOL_SPC_BT2020_NCL;
            video_codec_ctx_->profile = FF_PROFILE_HEVC_MAIN_10;
        } else {
            video_codec_ctx_->pix_fmt = AV_PIX_FMT_YUV420P;
            video_codec_ctx_->color_range = AVCOL_RANGE_MPEG;
            video_codec_ctx_->color_primaries = AVCOL_PRI_BT709;
            video_codec_ctx_->color_trc = AVCOL_TRC_BT709;
            video_codec_ctx_->colorspace = AVCOL_SPC_BT709;
        }
        
        if (format_ctx_->oformat->flags & AVFMT_GLOBALHEADER) {
            video_codec_ctx_->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
        }
        
        if (config_.video_codec == CodecID::H265) {
            av_opt_set(video_codec_ctx_->priv_data, "preset", "fast", 0);
            av_opt_set_int(video_codec_ctx_->priv_data, "threads", 8, 0);
            
            if (config_.output_hdr_type != HDRType::SDR) {
                av_opt_set(video_codec_ctx_->priv_data, "hdr", "1", 0);
                if (config_.output_hdr_type == HDRType::HDR10 ||
                    config_.output_hdr_type == HDRType::HDR10Plus ||
                    config_.output_hdr_type == HDRType::DolbyVision) {
                    char hdr_opt[512];
                    snprintf(hdr_opt, sizeof(hdr_opt),
                            "master-display=G(%d,%d)B(%d,%d)R(%d,%d)WP(%d,%d)L(%d,%d)",
                            (int)(config_.hdr_metadata.mastering_display.g.x * 50000),
                            (int)(config_.hdr_metadata.mastering_display.g.y * 50000),
                            (int)(config_.hdr_metadata.mastering_display.b.x * 50000),
                            (int)(config_.hdr_metadata.mastering_display.b.y * 50000),
                            (int)(config_.hdr_metadata.mastering_display.r.x * 50000),
                            (int)(config_.hdr_metadata.mastering_display.r.y * 50000),
                            (int)(config_.hdr_metadata.mastering_display.white_point.x * 50000),
                            (int)(config_.hdr_metadata.mastering_display.white_point.y * 50000),
                            (int)(config_.hdr_metadata.mastering_display.max_luminance * 10000),
                            (int)(config_.hdr_metadata.mastering_display.min_luminance * 10000));
                    av_opt_set(video_codec_ctx_->priv_data, "x265-params", hdr_opt, 0);
                    
                    char cll_opt[128];
                    snprintf(cll_opt, sizeof(cll_opt), "max-cll=%d,%d",
                            config_.hdr_metadata.cll.max_content_light_level,
                            config_.hdr_metadata.cll.max_pixel_average_light_level);
                    av_opt_set(video_codec_ctx_->priv_data, "x265-params", cll_opt, 0);
                }
            }
        } else {
            av_opt_set(video_codec_ctx_->priv_data, "preset", "fast", 0);
            av_opt_set(video_codec_ctx_->priv_data, "tune", "zerolatency", 0);
            av_opt_set_int(video_codec_ctx_->priv_data, "threads", 8, 0);
        }
        
        if (avcodec_open2(video_codec_ctx_, codec, nullptr) < 0) {
            VE_LOG_ERROR("Failed to open video codec");
            return false;
        }
        
        video_stream_ = avformat_new_stream(format_ctx_, nullptr);
        avcodec_parameters_from_context(video_stream_->codecpar, video_codec_ctx_);
        video_stream_->time_base = video_codec_ctx_->time_base;
        
        video_frame_ = av_frame_alloc();
        video_frame_->format = video_codec_ctx_->pix_fmt;
        video_frame_->width = video_codec_ctx_->width;
        video_frame_->height = video_codec_ctx_->height;
        av_frame_get_buffer(video_frame_, 0);
        
        packet_ = av_packet_alloc();
        return true;
    }
    
    bool OpenAudioCodec() {
        AVCodec* codec = avcodec_find_encoder(AV_CODEC_ID_AAC);
        if (!codec) return false;
        
        audio_codec_ctx_ = avcodec_alloc_context3(codec);
        if (!audio_codec_ctx_) return false;
        
        audio_codec_ctx_->sample_rate = config_.audio_sample_rate;
        audio_codec_ctx_->channel_layout = AV_CH_LAYOUT_STEREO;
        audio_codec_ctx_->channels = 2;
        audio_codec_ctx_->sample_fmt = AV_SAMPLE_FMT_FLTP;
        audio_codec_ctx_->bit_rate = config_.audio_bitrate;
        audio_codec_ctx_->time_base = {1, config_.audio_sample_rate};
        
        if (format_ctx_->oformat->flags & AVFMT_GLOBALHEADER) {
            audio_codec_ctx_->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
        }
        
        if (avcodec_open2(audio_codec_ctx_, codec, nullptr) < 0) {
            return false;
        }
        
        audio_stream_ = avformat_new_stream(format_ctx_, nullptr);
        avcodec_parameters_from_context(audio_stream_->codecpar, audio_codec_ctx_);
        audio_stream_->time_base = audio_codec_ctx_->time_base;
        
        audio_frame_ = av_frame_alloc();
        audio_frame_->format = audio_codec_ctx_->sample_fmt;
        audio_frame_->channel_layout = audio_codec_ctx_->channel_layout;
        audio_frame_->sample_rate = audio_codec_ctx_->sample_rate;
        audio_frame_->nb_samples = 1024;
        av_frame_get_buffer(audio_frame_, 0);
        
        return true;
    }
    
    void AddHDRMetadata(AVFrame* frame, const HDRMetadata& metadata) {
        if (!frame || metadata.hdr_type == HDRType::SDR) return;
        
        if (metadata.hdr_type == HDRType::HDR10 ||
            metadata.hdr_type == HDRType::HDR10Plus ||
            metadata.hdr_type == HDRType::DolbyVision) {
            
            AVMasteringDisplayMetadata* md = av_mastering_display_metadata_alloc();
            if (md) {
                md->has_primaries = 1;
                md->display_primaries[0][0] = av_d2q(metadata.mastering_display.r.x, 50000);
                md->display_primaries[0][1] = av_d2q(metadata.mastering_display.r.y, 50000);
                md->display_primaries[1][0] = av_d2q(metadata.mastering_display.g.x, 50000);
                md->display_primaries[1][1] = av_d2q(metadata.mastering_display.g.y, 50000);
                md->display_primaries[2][0] = av_d2q(metadata.mastering_display.b.x, 50000);
                md->display_primaries[2][1] = av_d2q(metadata.mastering_display.b.y, 50000);
                md->white_point[0] = av_d2q(metadata.mastering_display.white_point.x, 50000);
                md->white_point[1] = av_d2q(metadata.mastering_display.white_point.y, 50000);
                md->has_luminance = 1;
                md->min_luminance = av_d2q(metadata.mastering_display.min_luminance, 10000);
                md->max_luminance = av_d2q(metadata.mastering_display.max_luminance, 10000);
                
                av_frame_add_side_data(frame, AV_FRAME_DATA_MASTERING_DISPLAY_METADATA,
                                      (uint8_t*)md, sizeof(*md));
            }
            
            AVContentLightLevel* cll = av_content_light_level_alloc();
            if (cll) {
                cll->MaxCLL = metadata.cll.max_content_light_level;
                cll->MaxFALL = metadata.cll.max_pixel_average_light_level;
                
                av_frame_add_side_data(frame, AV_FRAME_DATA_CONTENT_LIGHT_LEVEL,
                                      (uint8_t*)cll, sizeof(*cll));
            }
        }
        
        if (metadata.hdr_type == HDRType::HDR10Plus && metadata.hdr10_plus.data_size > 0) {
            AVHDRDynamicMetadata* hdr10plus = av_hdr_dynamic_metadata_alloc();
            if (hdr10plus) {
                av_frame_add_side_data(frame, AV_FRAME_DATA_DYNAMIC_HDR_PLUS,
                                      (uint8_t*)hdr10plus, sizeof(*hdr10plus));
            }
        }
        
        if (metadata.hdr_type == HDRType::DolbyVision && metadata.dolby_vision.rpu_size > 0) {
            AVDOVIMetadata* dovi = av_dovi_metadata_alloc();
            if (dovi) {
                av_frame_add_side_data(frame, AV_FRAME_DATA_DOVI_METADATA,
                                      (uint8_t*)dovi, sizeof(*dovi));
            }
        }
    }
    
    void Close() {
        if (format_ctx_) {
            av_write_trailer(format_ctx_);
            if (!(format_ctx_->oformat->flags & AVFMT_NOFILE)) {
                avio_closep(&format_ctx_->pb);
            }
        }
        
        if (sws_ctx_) sws_freeContext(sws_ctx_);
        if (swr_ctx_) swr_free(&swr_ctx_);
        if (video_codec_ctx_) avcodec_free_context(&video_codec_ctx_);
        if (audio_codec_ctx_) avcodec_free_context(&audio_codec_ctx_);
        if (video_frame_) av_frame_free(&video_frame_);
        if (audio_frame_) av_frame_free(&audio_frame_);
        if (packet_) av_packet_free(&packet_);
        if (format_ctx_) avformat_free_context(format_ctx_);
        
        sws_ctx_ = nullptr;
        swr_ctx_ = nullptr;
        video_codec_ctx_ = nullptr;
        audio_codec_ctx_ = nullptr;
        video_frame_ = nullptr;
        audio_frame_ = nullptr;
        packet_ = nullptr;
        format_ctx_ = nullptr;
    }
    
    bool EncodeVideoFrame(const VideoFrame* frame) {
        if (!frame || !frame->data[0]) return false;
        
        ConvertToYUV(frame);
        
        if (config_.output_hdr_type != HDRType::SDR) {
            AddHDRMetadata(video_frame_, frame->hdr_metadata);
        }
        
        video_frame_->pts = video_frame_count_ * (video_codec_ctx_->time_base.num *
                          AV_TIME_BASE / video_codec_ctx_->time_base.den);
        
        int ret = avcodec_send_frame(video_codec_ctx_, video_frame_);
        if (ret < 0) return false;
        
        while (ret >= 0) {
            ret = avcodec_receive_packet(video_codec_ctx_, packet_);
            if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) break;
            if (ret < 0) return false;
            
            av_packet_rescale_ts(packet_, video_codec_ctx_->time_base,
                                video_stream_->time_base);
            packet_->stream_index = video_stream_->index;
            av_interleaved_write_frame(format_ctx_, packet_);
            av_packet_unref(packet_);
        }
        
        video_frame_count_++;
        return true;
    }
    
    void ConvertToYUV(const VideoFrame* frame) {
        AVPixelFormat src_format = AV_PIX_FMT_RGBA;
        if (frame->format == PixelFormat::RGBA16F) {
            src_format = AV_PIX_FMT_RGBAF16LE;
        } else if (frame->format == PixelFormat::RGB48) {
            src_format = AV_PIX_FMT_RGB48LE;
        }
        
        if (!sws_ctx_) {
            sws_ctx_ = sws_getContext(
                frame->width, frame->height, src_format,
                video_codec_ctx_->width, video_codec_ctx_->height,
                video_codec_ctx_->pix_fmt, SWS_FAST_BILINEAR,
                nullptr, nullptr, nullptr);
        }
        
        const uint8_t* src_data[4] = {frame->data[0], nullptr, nullptr, nullptr};
        int src_linesize[4] = {frame->linesize[0], 0, 0, 0};
        
        sws_scale(sws_ctx_, src_data, src_linesize, 0, frame->height,
                  video_frame_->data, video_frame_->linesize);
    }
    
    bool EncodeAudioFrame(const AudioFrame* frame) {
        if (!frame || !audio_codec_ctx_) return false;
        audio_frame_count_++;
        return true;
    }
    
    bool Flush() {
        int ret = avcodec_send_frame(video_codec_ctx_, nullptr);
        while (ret >= 0) {
            ret = avcodec_receive_packet(video_codec_ctx_, packet_);
            if (ret == AVERROR_EOF) break;
            if (ret < 0) return false;
            
            av_packet_rescale_ts(packet_, video_codec_ctx_->time_base,
                                video_stream_->time_base);
            packet_->stream_index = video_stream_->index;
            av_interleaved_write_frame(format_ctx_, packet_);
            av_packet_unref(packet_);
        }
        
        return true;
    }
    
    int64_t GetVideoFrameCount() const { return video_frame_count_; }
    int64_t GetAudioFrameCount() const { return audio_frame_count_; }
    const EncoderConfig& GetConfig() const { return config_; }
    
private:
    AVFormatContext* format_ctx_;
    AVCodecContext* video_codec_ctx_;
    AVCodecContext* audio_codec_ctx_;
    SwsContext* sws_ctx_;
    SwrContext* swr_ctx_;
    AVFrame* video_frame_;
    AVFrame* audio_frame_;
    AVPacket* packet_;
    AVStream* video_stream_;
    AVStream* audio_stream_;
    EncoderConfig config_;
    int64_t video_frame_count_;
    int64_t audio_frame_count_;
};

VideoEncoder::VideoEncoder() : impl_(std::make_unique<Impl>()) {}
VideoEncoder::~VideoEncoder() = default;
bool VideoEncoder::Open(const EncoderConfig& config) { return impl_->Open(config); }
void VideoEncoder::Close() { impl_->Close(); }
bool VideoEncoder::EncodeVideoFrame(const VideoFrame* frame) { return impl_->EncodeVideoFrame(frame); }
bool VideoEncoder::EncodeAudioFrame(const AudioFrame* frame) { return impl_->EncodeAudioFrame(frame); }
bool VideoEncoder::Flush() { return impl_->Flush(); }
int64_t VideoEncoder::GetVideoFrameCount() const { return impl_->GetVideoFrameCount(); }
int64_t VideoEncoder::GetAudioFrameCount() const { return impl_->GetAudioFrameCount(); }
const EncoderConfig& VideoEncoder::GetConfig() const { return impl_->GetConfig(); }

}

#pragma warning(pop)
