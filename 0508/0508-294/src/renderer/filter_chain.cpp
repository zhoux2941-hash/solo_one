#include "ve/filters.h"
#include <glad/glad.h>

namespace ve {

Filter::Filter(FilterType type) : type_(type) {}
Filter::~Filter() = default;

FilterType Filter::GetType() const { return type_; }

bool Filter::Initialize() { return true; }
void Filter::Release() {}

void Filter::Apply(int input_texture, const Size& size, float progress) {}

void Filter::SetParam(const std::string& name, float value) { params_[name] = value; }
float Filter::GetParam(const std::string& name, float default_value) const {
    auto it = params_.find(name);
    return it != params_.end() ? it->second : default_value;
}

class FilterChain::Impl {
public:
    Impl() : size_(0, 0), ping_pong_textures_{0, 0}, fbo_(0), vao_(0) {}
    
    ~Impl() { Shutdown(); }
    
    bool Initialize(const Size& size) {
        size_ = size;
        
        glGenFramebuffers(1, &fbo_);
        
        glGenTextures(2, ping_pong_textures_);
        for (int i = 0; i < 2; i++) {
            glBindTexture(GL_TEXTURE_2D, ping_pong_textures_[i]);
            glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, size.width, size.height,
                        0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        }
        
        CreateQuadVAO();
        return true;
    }
    
    void Shutdown() {
        glDeleteFramebuffers(1, &fbo_);
        glDeleteTextures(2, ping_pong_textures_);
        glDeleteVertexArrays(1, &vao_);
        filters_.clear();
    }
    
    void AddFilter(std::shared_ptr<Filter> filter) {
        filter->Initialize();
        filters_.push_back(filter);
    }
    
    void RemoveFilter(int index) {
        if (index >= 0 && index < (int)filters_.size()) {
            filters_[index]->Release();
            filters_.erase(filters_.begin() + index);
        }
    }
    
    void Clear() {
        for (auto& f : filters_) f->Release();
        filters_.clear();
    }
    
    int GetFilterCount() const { return (int)filters_.size(); }
    std::shared_ptr<Filter> GetFilter(int index) const {
        return (index >= 0 && index < (int)filters_.size()) ? filters_[index] : nullptr;
    }
    
    int Process(int input_texture) {
        int current = input_texture;
        int ping_pong_idx = 0;
        
        for (auto& filter : filters_) {
            glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
            glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                                  GL_TEXTURE_2D, ping_pong_textures_[ping_pong_idx], 0);
            glViewport(0, 0, size_.width, size_.height);
            
            filter->Apply(current, size_);
            
            current = ping_pong_textures_[ping_pong_idx];
            ping_pong_idx = 1 - ping_pong_idx;
        }
        
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        return current;
    }
    
    int GetOutputTexture() const { return ping_pong_textures_[0]; }
    
private:
    void CreateQuadVAO() {
        float vertices[] = {
            -1.0f,  1.0f,  0.0f, 1.0f,
            -1.0f, -1.0f,  0.0f, 0.0f,
             1.0f, -1.0f,  1.0f, 0.0f,
             1.0f,  1.0f,  1.0f, 1.0f,
        };
        unsigned int indices[] = { 0, 1, 2, 0, 2, 3 };
        
        glGenVertexArrays(1, &vao_);
        glBindVertexArray(vao_);
        
        GLuint vbo, ebo;
        glGenBuffers(1, &vbo);
        glBindBuffer(GL_ARRAY_BUFFER, vbo);
        glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
        
        glGenBuffers(1, &ebo);
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
        
        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
        glEnableVertexAttribArray(1);
        
        glBindVertexArray(0);
    }
    
    Size size_;
    GLuint ping_pong_textures_[2];
    GLuint fbo_;
    GLuint vao_;
    std::vector<std::shared_ptr<Filter>> filters_;
};

FilterChain::FilterChain() : impl_(std::make_unique<Impl>()) {}
FilterChain::~FilterChain() = default;
bool FilterChain::Initialize(const Size& size) { return impl_->Initialize(size); }
void FilterChain::Shutdown() { impl_->Shutdown(); }
void FilterChain::AddFilter(std::shared_ptr<Filter> filter) { impl_->AddFilter(filter); }
void FilterChain::RemoveFilter(int index) { impl_->RemoveFilter(index); }
void FilterChain::Clear() { impl_->Clear(); }
int FilterChain::GetFilterCount() const { return impl_->GetFilterCount(); }
std::shared_ptr<Filter> FilterChain::GetFilter(int index) const { return impl_->GetFilter(index); }
int FilterChain::Process(int input_texture) { return impl_->Process(input_texture); }
int FilterChain::GetOutputTexture() const { return impl_->GetOutputTexture(); }

const char* g_filter_vs = R"(
    #version 330 core
    layout (location = 0) in vec2 aPos;
    layout (location = 1) in vec2 aTexCoord;
    out vec2 TexCoord;
    void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
        TexCoord = aTexCoord;
    }
)";

const char* g_brightness_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uBrightness;
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        color.rgb = clamp(color.rgb + uBrightness, 0.0, 1.0);
        FragColor = color;
    }
)";

const char* g_contrast_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uContrast;
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
        FragColor = color;
    }
)";

const char* g_saturation_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uSaturation;
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 gray = vec3(luminance);
        color.rgb = mix(gray, color.rgb, uSaturation);
        FragColor = color;
    }
)";

const char* g_sepia_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        float r = color.r * 0.393 + color.g * 0.769 + color.b * 0.189;
        float g = color.r * 0.349 + color.g * 0.686 + color.b * 0.168;
        float b = color.r * 0.272 + color.g * 0.534 + color.b * 0.131;
        FragColor = vec4(r, g, b, color.a);
    }
)";

const char* g_vignette_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTexture;
    uniform float uIntensity;
    uniform float uRadius;
    void main() {
        vec4 color = texture(uTexture, TexCoord);
        vec2 center = vec2(0.5, 0.5);
        float dist = length(TexCoord - center);
        float vignette = smoothstep(uRadius, uRadius - uIntensity, dist);
        color.rgb *= vignette;
        FragColor = color;
    }
)";

BrightnessFilter::BrightnessFilter() : Filter(FilterType::Brightness) {
    SetParam("brightness", 0.0f);
}

bool BrightnessFilter::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_filter_vs, g_brightness_fs);
}

void BrightnessFilter::Apply(int input_texture, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTexture", 0);
    shader_->SetUniform("uBrightness", GetParam("brightness") * progress);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, input_texture);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

ContrastFilter::ContrastFilter() : Filter(FilterType::Contrast) {
    SetParam("contrast", 1.0f);
}

bool ContrastFilter::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_filter_vs, g_contrast_fs);
}

void ContrastFilter::Apply(int input_texture, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTexture", 0);
    float contrast = 1.0f + (GetParam("contrast") - 1.0f) * progress;
    shader_->SetUniform("uContrast", contrast);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, input_texture);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

SaturationFilter::SaturationFilter() : Filter(FilterType::Saturation) {
    SetParam("saturation", 1.0f);
}

bool SaturationFilter::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_filter_vs, g_saturation_fs);
}

void SaturationFilter::Apply(int input_texture, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTexture", 0);
    float saturation = 1.0f + (GetParam("saturation") - 1.0f) * progress;
    shader_->SetUniform("uSaturation", saturation);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, input_texture);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

SepiaFilter::SepiaFilter() : Filter(FilterType::Sepia) {}

bool SepiaFilter::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_filter_vs, g_sepia_fs);
}

void SepiaFilter::Apply(int input_texture, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTexture", 0);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, input_texture);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

VignetteFilter::VignetteFilter() : Filter(FilterType::Vignette) {
    SetParam("intensity", 0.5f);
    SetParam("radius", 0.8f);
}

bool VignetteFilter::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_filter_vs, g_vignette_fs);
}

void VignetteFilter::Apply(int input_texture, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTexture", 0);
    shader_->SetUniform("uIntensity", GetParam("intensity") * progress);
    shader_->SetUniform("uRadius", GetParam("radius"));
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, input_texture);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

GaussianBlurFilter::GaussianBlurFilter() : Filter(FilterType::GaussianBlur) {
    SetParam("radius", 5.0f);
}
bool GaussianBlurFilter::Initialize() { return true; }
void GaussianBlurFilter::Apply(int input_texture, const Size& size, float progress) {}

SharpenFilter::SharpenFilter() : Filter(FilterType::Sharpen) {
    SetParam("amount", 1.0f);
}
bool SharpenFilter::Initialize() { return true; }
void SharpenFilter::Apply(int input_texture, const Size& size, float progress) {}

}
