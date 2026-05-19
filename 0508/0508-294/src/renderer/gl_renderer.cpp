#include "ve/renderer.h"
#include "ve/utils/logger.h"
#include <algorithm>
#include <cmath>

#ifdef _WIN32
#include <windows.h>
#endif

namespace ve {

const char* g_vertex_shader = R"(
    #version 330 core
    layout (location = 0) in vec2 aPos;
    layout (location = 1) in vec2 aTexCoord;
    out vec2 TexCoord;
    void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
        TexCoord = aTexCoord;
    }
)";

const char* g_sdr_fragment_shader = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uOpacity;
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        FragColor = vec4(color.rgb, color.a * uOpacity);
    }
)";

const char* g_hdr_pq_to_linear = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform float uExposure;
    uniform float uGamma;
    
    float pq_to_linear(float x) {
        float m1 = 0.1593017578125;
        float m2 = 78.84375;
        float c1 = 0.8359375;
        float c2 = 18.8515625;
        float c3 = 18.6875;
        
        float y = pow(max(x, 1e-6), 1.0 / m2);
        float num = max(y - c1, 0.0);
        float den = c2 - c3 * y;
        return pow(num / den, 1.0 / m1);
    }
    
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        vec3 linear = vec3(
            pq_to_linear(color.r),
            pq_to_linear(color.g),
            pq_to_linear(color.b)
        );
        linear = vec3(1.0) - exp(-linear * uExposure);
        linear = pow(linear, vec3(1.0 / uGamma));
        FragColor = vec4(linear, color.a * uOpacity);
    }
)";

const char* g_hdr_hlg_to_linear = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform float uBrightness;
    uniform float uGamma;
    
    float hlg_oetf(float x) {
        const float a = 0.17883277;
        const float b = 0.28466892;
        const float c = 0.55991073;
        if (x <= 1.0 / 12.0) {
            return sqrt(3.0 * x);
        } else {
            return a * log(12.0 * x - b) + c;
        }
    }
    
    float hlg_inverse(float y) {
        const float a = 0.17883277;
        const float b = 0.28466892;
        const float c = 0.55991073;
        if (y <= 0.5) {
            return y * y / 3.0;
        } else {
            return (exp((y - c) / a) + b) / 12.0;
        }
    }
    
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        vec3 linear = vec3(
            hlg_inverse(color.r),
            hlg_inverse(color.g),
            hlg_inverse(color.b)
        ) * uBrightness;
        linear = pow(linear, vec3(1.0 / uGamma));
        FragColor = vec4(linear, color.a * uOpacity);
    }
)";

const char* g_hdr_tonemap = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform float uExposure;
    
    vec3 aces(vec3 x) {
        const float a = 2.51;
        const float b = 0.03;
        const float c = 2.43;
        const float d = 0.59;
        const float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }
    
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        vec3 hdr = color.rgb * uExposure;
        vec3 ldr = aces(hdr);
        FragColor = vec4(ldr, color.a * uOpacity);
    }
)";

class GLRenderer::Impl {
public:
    Size size_;
    Color clear_color_;
    GLuint fbo_;
    GLuint hdr_fbo_;
    GLuint color_texture_;
    GLuint hdr_texture_;
    GLuint quad_vao_;
    GLuint quad_vbo_;
    GLuint quad_ebo_;
    GLuint sdr_program_;
    GLuint pq_program_;
    GLuint hlg_program_;
    GLuint tonemap_program_;
    bool hdr_enabled_;
    HDRMetadata hdr_metadata_;
    float exposure_;
    float gamma_;
    float brightness_;
    
    Impl() : fbo_(0), hdr_fbo_(0), color_texture_(0), hdr_texture_(0),
             quad_vao_(0), quad_vbo_(0), quad_ebo_(0),
             sdr_program_(0), pq_program_(0), hlg_program_(0), tonemap_program_(0),
             hdr_enabled_(false), exposure_(1.0f), gamma_(2.2f), brightness_(1.0f) {}
    
    ~Impl() { Shutdown(); }
    
    GLuint CompileShader(const char* vs, const char* fs) {
        GLuint vs_id = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vs_id, 1, &vs, nullptr);
        glCompileShader(vs_id);
        
        GLint success;
        glGetShaderiv(vs_id, GL_COMPILE_STATUS, &success);
        if (!success) {
            VE_LOG_ERROR("Vertex shader compilation failed");
            glDeleteShader(vs_id);
            return 0;
        }
        
        GLuint fs_id = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fs_id, 1, &fs, nullptr);
        glCompileShader(fs_id);
        
        glGetShaderiv(fs_id, GL_COMPILE_STATUS, &success);
        if (!success) {
            VE_LOG_ERROR("Fragment shader compilation failed");
            glDeleteShader(vs_id);
            glDeleteShader(fs_id);
            return 0;
        }
        
        GLuint program = glCreateProgram();
        glAttachShader(program, vs_id);
        glAttachShader(program, fs_id);
        glLinkProgram(program);
        
        glGetProgramiv(program, GL_LINK_STATUS, &success);
        if (!success) {
            VE_LOG_ERROR("Shader program linking failed");
            glDeleteShader(vs_id);
            glDeleteShader(fs_id);
            glDeleteProgram(program);
            return 0;
        }
        
        glDeleteShader(vs_id);
        glDeleteShader(fs_id);
        return program;
    }
    
    bool Initialize(const Size& size, bool enable_hdr) {
        size_ = size;
        hdr_enabled_ = enable_hdr;
        
        if (!gladLoadGL()) {
            VE_LOG_ERROR("Failed to initialize GLAD");
            return false;
        }
        
        CreateQuadGeometry();
        
        sdr_program_ = CompileShader(g_vertex_shader, g_sdr_fragment_shader);
        pq_program_ = CompileShader(g_vertex_shader, g_hdr_pq_to_linear);
        hlg_program_ = CompileShader(g_vertex_shader, g_hdr_hlg_to_linear);
        tonemap_program_ = CompileShader(g_vertex_shader, g_hdr_tonemap);
        
        if (!sdr_program_ || !pq_program_ || !hlg_program_ || !tonemap_program_) {
            VE_LOG_ERROR("Failed to compile HDR shaders");
            return false;
        }
        
        glGenFramebuffers(1, &fbo_);
        glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
        
        glGenTextures(1, &color_texture_);
        glBindTexture(GL_TEXTURE_2D, color_texture_);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, size.width, size.height,
                    0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                              GL_TEXTURE_2D, color_texture_, 0);
        
        if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
            VE_LOG_ERROR("SDR Framebuffer not complete");
            return false;
        }
        
        if (hdr_enabled_) {
            glGenFramebuffers(1, &hdr_fbo_);
            glBindFramebuffer(GL_FRAMEBUFFER, hdr_fbo_);
            
            glGenTextures(1, &hdr_texture_);
            glBindTexture(GL_TEXTURE_2D, hdr_texture_);
            glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, size.width, size.height,
                        0, GL_RGBA, GL_FLOAT, nullptr);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
            glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                                  GL_TEXTURE_2D, hdr_texture_, 0);
            
            if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
                VE_LOG_ERROR("HDR Framebuffer not complete");
                hdr_enabled_ = false;
            }
        }
        
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        
        VE_LOG_INFO("GLRenderer initialized: %dx%d, HDR: %s",
                   size.width, size.height, hdr_enabled_ ? "enabled" : "disabled");
        return true;
    }
    
    void Shutdown() {
        if (sdr_program_) glDeleteProgram(sdr_program_);
        if (pq_program_) glDeleteProgram(pq_program_);
        if (hlg_program_) glDeleteProgram(hlg_program_);
        if (tonemap_program_) glDeleteProgram(tonemap_program_);
        if (quad_vao_) glDeleteVertexArrays(1, &quad_vao_);
        if (quad_vbo_) glDeleteBuffers(1, &quad_vbo_);
        if (quad_ebo_) glDeleteBuffers(1, &quad_ebo_);
        if (hdr_texture_) glDeleteTextures(1, &hdr_texture_);
        if (color_texture_) glDeleteTextures(1, &color_texture_);
        if (hdr_fbo_) glDeleteFramebuffers(1, &hdr_fbo_);
        if (fbo_) glDeleteFramebuffers(1, &fbo_);
    }
    
    void CreateQuadGeometry() {
        float vertices[] = {
            -1.0f,  1.0f,  0.0f, 1.0f,
            -1.0f, -1.0f,  0.0f, 0.0f,
             1.0f, -1.0f,  1.0f, 0.0f,
             1.0f,  1.0f,  1.0f, 1.0f,
        };
        unsigned int indices[] = { 0, 1, 2, 0, 2, 3 };
        
        glGenVertexArrays(1, &quad_vao_);
        glBindVertexArray(quad_vao_);
        
        glGenBuffers(1, &quad_vbo_);
        glBindBuffer(GL_ARRAY_BUFFER, quad_vbo_);
        glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
        
        glGenBuffers(1, &quad_ebo_);
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, quad_ebo_);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
        
        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
        glEnableVertexAttribArray(1);
        
        glBindVertexArray(0);
    }
    
    void SetClearColor(const Color& color) {
        clear_color_ = color;
    }
    
    void Clear() {
        glBindFramebuffer(GL_FRAMEBUFFER, hdr_enabled_ ? hdr_fbo_ : fbo_);
        glViewport(0, 0, size_.width, size_.height);
        glClearColor(clear_color_.r, clear_color_.g, clear_color_.b, clear_color_.a);
        glClear(GL_COLOR_BUFFER_BIT);
    }
    
    bool UploadTexture(int texture_id, const VideoFrame* frame) {
        glBindTexture(GL_TEXTURE_2D, texture_id);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, frame->width, frame->height,
                    0, GL_RGBA, GL_UNSIGNED_BYTE, frame->data[0]);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        return true;
    }
    
    bool UploadHDRTexture(int texture_id, const VideoFrame* frame) {
        glBindTexture(GL_TEXTURE_2D, texture_id);
        
        if (frame->format == PixelFormat::RGBA16F) {
            glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, frame->width, frame->height,
                        0, GL_RGBA, GL_FLOAT, frame->data[0]);
        } else {
            glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, frame->width, frame->height,
                        0, GL_RGBA, GL_UNSIGNED_BYTE, frame->data[0]);
        }
        
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        return true;
    }
    
    void DeleteTexture(int texture_id) {
        glDeleteTextures(1, (GLuint*)&texture_id);
    }
    
    void SetHDRMetadata(const HDRMetadata& metadata) {
        hdr_metadata_ = metadata;
    }
    
    const HDRMetadata& GetHDRMetadata() const {
        return hdr_metadata_;
    }
    
    bool IsHDREnabled() const {
        return hdr_enabled_;
    }
    
    void SetToneMapping(float exposure, float gamma) {
        exposure_ = exposure;
        gamma_ = gamma;
    }
    
    void SetHLGToSDR(float brightness) {
        brightness_ = brightness;
    }
    
    void DrawTexture(int texture_id, const Rect& src_rect, const Rect& dst_rect, float opacity) {
        DrawTextureProgram(sdr_program_, texture_id, src_rect, dst_rect, opacity);
    }
    
    void DrawHDRTexture(int texture_id, const Rect& src_rect, const Rect& dst_rect, float opacity) {
        GLuint program = sdr_program_;
        if (hdr_metadata_.transfer == TransferCharacteristics::PQ) {
            program = pq_program_;
        } else if (hdr_metadata_.transfer == TransferCharacteristics::HLG) {
            program = hlg_program_;
        }
        
        DrawTextureProgram(program, texture_id, src_rect, dst_rect, opacity);
    }
    
    void DrawTextureProgram(GLuint program, int texture_id, const Rect& src_rect, 
                           const Rect& dst_rect, float opacity) {
        glBindFramebuffer(GL_FRAMEBUFFER, hdr_enabled_ ? hdr_fbo_ : fbo_);
        glViewport(0, 0, size_.width, size_.height);
        
        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
        
        glUseProgram(program);
        
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture_id);
        glUniform1i(glGetUniformLocation(program, "uTexture"), 0);
        glUniform1f(glGetUniformLocation(program, "uOpacity"), opacity);
        
        if (program == pq_program_) {
            glUniform1f(glGetUniformLocation(program, "uExposure"), exposure_);
            glUniform1f(glGetUniformLocation(program, "uGamma"), gamma_);
        } else if (program == hlg_program_) {
            glUniform1f(glGetUniformLocation(program, "uBrightness"), brightness_);
            glUniform1f(glGetUniformLocation(program, "uGamma"), gamma_);
        }
        
        glBindVertexArray(quad_vao_);
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
        
        glDisable(GL_BLEND);
    }
    
    void DrawTextureWithTransform(int texture_id, const Rect& dst_rect, const Vec3& rotation, float scale, float opacity) {
        DrawTexture(texture_id, Rect(0, 0, size_.width, size_.height), dst_rect, opacity);
    }
    
    void DrawRectangle(const Rect& rect, const Color& color, float border_width) {}
    void DrawText(const char* text, const Vec2& position, const Color& color, int font_size) {}
    
    void SetViewport(const Rect& viewport) {
        glViewport(viewport.x, viewport.y, viewport.width, viewport.height);
    }
    
    bool ReadFrame(VideoFrame* frame, PixelFormat format) {
        glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
        glReadBuffer(GL_COLOR_ATTACHMENT0);
        
        int buffer_size = size_.width * size_.height * 4;
        frame->data[0] = new uint8_t[buffer_size];
        frame->linesize[0] = size_.width * 4;
        frame->width = size_.width;
        frame->height = size_.height;
        frame->format = format;
        
        glReadPixels(0, 0, size_.width, size_.height, GL_RGBA, GL_UNSIGNED_BYTE, frame->data[0]);
        
        FlipVertical(frame->data[0], size_.width, size_.height);
        
        return true;
    }
    
    bool ReadHDRFrame(VideoFrame* frame) {
        glBindFramebuffer(GL_FRAMEBUFFER, hdr_enabled_ ? hdr_fbo_ : fbo_);
        glReadBuffer(GL_COLOR_ATTACHMENT0);
        
        int buffer_size = size_.width * size_.height * 4 * sizeof(float);
        frame->data[0] = new uint8_t[buffer_size];
        frame->linesize[0] = size_.width * 4 * sizeof(float);
        frame->width = size_.width;
        frame->height = size_.height;
        frame->format = PixelFormat::RGBA16F;
        frame->hdr_metadata = hdr_metadata_;
        
        glReadPixels(0, 0, size_.width, size_.height, GL_RGBA, GL_FLOAT, frame->data[0]);
        
        FlipVerticalFloat((float*)frame->data[0], size_.width, size_.height);
        
        return true;
    }
    
    void FlipVertical(uint8_t* data, int width, int height) {
        int row_size = width * 4;
        std::vector<uint8_t> temp(row_size);
        for (int y = 0; y < height / 2; y++) {
            uint8_t* row1 = data + y * row_size;
            uint8_t* row2 = data + (height - 1 - y) * row_size;
            memcpy(temp.data(), row1, row_size);
            memcpy(row1, row2, row_size);
            memcpy(row2, temp.data(), row_size);
        }
    }
    
    void FlipVerticalFloat(float* data, int width, int height) {
        int row_size = width * 4;
        std::vector<float> temp(row_size);
        for (int y = 0; y < height / 2; y++) {
            float* row1 = data + y * row_size;
            float* row2 = data + (height - 1 - y) * row_size;
            memcpy(temp.data(), row1, row_size * sizeof(float));
            memcpy(row1, row2, row_size * sizeof(float));
            memcpy(row2, temp.data(), row_size * sizeof(float));
        }
    }
    
    void BeginRender() {
        glBindFramebuffer(GL_FRAMEBUFFER, hdr_enabled_ ? hdr_fbo_ : fbo_);
        glViewport(0, 0, size_.width, size_.height);
    }
    
    void EndRender() {
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
    }
    
    unsigned int GetFramebuffer() const {
        return hdr_enabled_ ? hdr_fbo_ : fbo_;
    }
    
    Size GetSize() const {
        return size_;
    }
};

GLRenderer::GLRenderer() : impl_(std::make_unique<Impl>()) {}
GLRenderer::~GLRenderer() = default;
bool GLRenderer::Initialize(const Size& size, bool enable_hdr) { return impl_->Initialize(size, enable_hdr); }
void GLRenderer::Shutdown() { impl_->Shutdown(); }
void GLRenderer::SetClearColor(const Color& color) { impl_->SetClearColor(color); }
void GLRenderer::Clear() { impl_->Clear(); }
bool GLRenderer::UploadTexture(int texture_id, const VideoFrame* frame) { return impl_->UploadTexture(texture_id, frame); }
bool GLRenderer::UploadHDRTexture(int texture_id, const VideoFrame* frame) { return impl_->UploadHDRTexture(texture_id, frame); }
void GLRenderer::DeleteTexture(int texture_id) { impl_->DeleteTexture(texture_id); }
void GLRenderer::SetHDRMetadata(const HDRMetadata& metadata) { impl_->SetHDRMetadata(metadata); }
const HDRMetadata& GLRenderer::GetHDRMetadata() const { return impl_->GetHDRMetadata(); }
bool GLRenderer::IsHDREnabled() const { return impl_->IsHDREnabled(); }
void GLRenderer::SetToneMapping(float exposure, float gamma) { impl_->SetToneMapping(exposure, gamma); }
void GLRenderer::SetHLGToSDR(float brightness) { impl_->SetHLGToSDR(brightness); }
void GLRenderer::DrawTexture(int texture_id, const Rect& src_rect, const Rect& dst_rect, float opacity) { impl_->DrawTexture(texture_id, src_rect, dst_rect, opacity); }
void GLRenderer::DrawHDRTexture(int texture_id, const Rect& src_rect, const Rect& dst_rect, float opacity) { impl_->DrawHDRTexture(texture_id, src_rect, dst_rect, opacity); }
void GLRenderer::DrawTextureWithTransform(int texture_id, const Rect& dst_rect, const Vec3& rotation, float scale, float opacity) { impl_->DrawTextureWithTransform(texture_id, dst_rect, rotation, scale, opacity); }
void GLRenderer::DrawRectangle(const Rect& rect, const Color& color, float border_width) { impl_->DrawRectangle(rect, color, border_width); }
void GLRenderer::DrawText(const char* text, const Vec2& position, const Color& color, int font_size) { impl_->DrawText(text, position, color, font_size); }
void GLRenderer::SetViewport(const Rect& viewport) { impl_->SetViewport(viewport); }
bool GLRenderer::ReadFrame(VideoFrame* frame, PixelFormat format) { return impl_->ReadFrame(frame, format); }
bool GLRenderer::ReadHDRFrame(VideoFrame* frame) { return impl_->ReadHDRFrame(frame); }
void GLRenderer::BeginRender() { impl_->BeginRender(); }
void GLRenderer::EndRender() { impl_->EndRender(); }
unsigned int GLRenderer::GetFramebuffer() const { return impl_->GetFramebuffer(); }
Size GLRenderer::GetSize() const { return impl_->GetSize(); }

}
