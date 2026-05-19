#pragma once

#include "ve/types.h"

namespace ve {

class VE_API GLRenderer {
public:
    GLRenderer();
    ~GLRenderer();
    
    bool Initialize(const Size& size, bool enable_hdr = false);
    void Shutdown();
    
    void SetClearColor(const Color& color);
    void Clear();
    
    bool UploadTexture(int texture_id, const VideoFrame* frame);
    bool UploadHDRTexture(int texture_id, const VideoFrame* frame);
    void DeleteTexture(int texture_id);
    
    void SetHDRMetadata(const HDRMetadata& metadata);
    const HDRMetadata& GetHDRMetadata() const;
    bool IsHDREnabled() const;
    
    void SetToneMapping(float exposure, float gamma = 2.2f);
    void SetHLGToSDR(float brightness = 1.0f);
    
    void DrawTexture(int texture_id, const Rect& src_rect, const Rect& dst_rect, float opacity = 1.0f);
    void DrawHDRTexture(int texture_id, const Rect& src_rect, const Rect& dst_rect, float opacity = 1.0f);
    void DrawTextureWithTransform(int texture_id, const Rect& dst_rect, const Vec3& rotation, float scale, float opacity);
    
    void DrawRectangle(const Rect& rect, const Color& color, float border_width = 0);
    void DrawText(const char* text, const Vec2& position, const Color& color, int font_size);
    
    void SetViewport(const Rect& viewport);
    
    bool ReadFrame(VideoFrame* frame, PixelFormat format = PixelFormat::RGBA);
    bool ReadHDRFrame(VideoFrame* frame);
    
    void BeginRender();
    void EndRender();
    
    unsigned int GetFramebuffer() const;
    Size GetSize() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API Shader {
public:
    Shader();
    ~Shader();
    
    bool Compile(const char* vertex_source, const char* fragment_source);
    void Release();
    
    void Use();
    
    void SetUniform(const char* name, float value);
    void SetUniform(const char* name, const Vec2& value);
    void SetUniform(const char* name, const Vec3& value);
    void SetUniform(const char* name, const Color& value);
    void SetUniform(const char* name, int value);
    void SetUniformMatrix4(const char* name, const float* matrix);
    
    unsigned int GetId() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

}
