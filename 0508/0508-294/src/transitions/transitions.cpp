#include "ve/transitions.h"
#include <glad/glad.h>
#include <cmath>

namespace ve {

Transition::Transition(TransitionType type) : type_(type) {}
Transition::~Transition() = default;

TransitionType Transition::GetType() const { return type_; }
bool Transition::Initialize() { return true; }
void Transition::Release() {}
void Transition::Render(int texture_a, int texture_b, const Size& size, float progress) {}

const char* g_transition_vs = R"(
    #version 330 core
    layout (location = 0) in vec2 aPos;
    layout (location = 1) in vec2 aTexCoord;
    out vec2 TexCoord;
    void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
        TexCoord = aTexCoord;
    }
)";

const char* g_fade_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    void main() {
        vec4 colorA = texture(uTextureA, TexCoord);
        vec4 colorB = texture(uTextureB, TexCoord);
        FragColor = mix(colorA, colorB, uProgress);
    }
)";

const char* g_dissolve_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    void main() {
        vec4 colorA = texture(uTextureA, TexCoord);
        vec4 colorB = texture(uTextureB, TexCoord);
        float noise = random(TexCoord);
        float threshold = uProgress;
        FragColor = noise < threshold ? colorB : colorA;
    }
)";

const char* g_slide_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    uniform int uDirection;
    void main() {
        vec2 coord = TexCoord;
        if (uDirection == 0) coord.x -= uProgress;
        else if (uDirection == 1) coord.x += uProgress;
        else if (uDirection == 2) coord.y += uProgress;
        else if (uDirection == 3) coord.y -= uProgress;
        
        vec4 colorA = texture(uTextureA, TexCoord);
        vec4 colorB = vec4(0.0);
        if (coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0) {
            colorB = texture(uTextureB, coord);
        }
        
        float mixAmount = 0.0;
        if (uDirection == 0) mixAmount = TexCoord.x > uProgress ? 1.0 : 0.0;
        else if (uDirection == 1) mixAmount = TexCoord.x < 1.0 - uProgress ? 1.0 : 0.0;
        else if (uDirection == 2) mixAmount = TexCoord.y < 1.0 - uProgress ? 1.0 : 0.0;
        else if (uDirection == 3) mixAmount = TexCoord.y > uProgress ? 1.0 : 0.0;
        
        FragColor = mix(colorB, colorA, mixAmount);
    }
)";

const char* g_wipe_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    uniform int uDirection;
    void main() {
        vec4 colorA = texture(uTextureA, TexCoord);
        vec4 colorB = texture(uTextureB, TexCoord);
        float mask = 0.0;
        if (uDirection == 0) mask = step(TexCoord.x, uProgress);
        else if (uDirection == 1) mask = step(1.0 - TexCoord.x, uProgress);
        else if (uDirection == 2) mask = step(1.0 - TexCoord.y, uProgress);
        else if (uDirection == 3) mask = step(TexCoord.y, uProgress);
        FragColor = mix(colorA, colorB, mask);
    }
)";

const char* g_ripple_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = length(TexCoord - center);
        float wave = sin(dist * 30.0 - uProgress * 20.0) * 0.02 * uProgress;
        vec2 coordA = TexCoord + normalize(TexCoord - center) * wave;
        vec2 coordB = TexCoord;
        vec4 colorA = texture(uTextureA, coordA);
        vec4 colorB = texture(uTextureB, coordB);
        float mask = smoothstep(0.0, 0.7, uProgress);
        FragColor = mix(colorA, colorB, mask);
    }
)";

const char* g_zoom_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    void main() {
        vec2 center = vec2(0.5, 0.5);
        float scaleA = 1.0 + uProgress * 0.5;
        float scaleB = 1.5 - uProgress * 0.5;
        vec2 coordA = (TexCoord - center) / scaleA + center;
        vec2 coordB = (TexCoord - center) / scaleB + center;
        vec4 colorA = texture(uTextureA, coordA);
        vec4 colorB = texture(uTextureB, coordB);
        float alpha = smoothstep(0.3, 0.7, uProgress);
        FragColor = mix(colorA, colorB, alpha);
    }
)";

const char* g_rotate_fs = R"(
    #version 330 core
    in vec2 TexCoord;
    out vec4 FragColor;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 offset = TexCoord - center;
        
        float angleA = uProgress * 3.14159;
        float angleB = -(1.0 - uProgress) * 3.14159;
        
        vec2 coordA = vec2(
            offset.x * cos(angleA) - offset.y * sin(angleA),
            offset.x * sin(angleA) + offset.y * cos(angleA)
        ) + center;
        
        vec2 coordB = vec2(
            offset.x * cos(angleB) - offset.y * sin(angleB),
            offset.x * sin(angleB) + offset.y * cos(angleB)
        ) + center;
        
        vec4 colorA = texture(uTextureA, coordA);
        vec4 colorB = texture(uTextureB, coordB);
        FragColor = mix(colorA, colorB, smoothstep(0.2, 0.8, uProgress));
    }
)";

FadeTransition::FadeTransition() : Transition(TransitionType::Fade) {}

bool FadeTransition::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_transition_vs, g_fade_fs);
}

void FadeTransition::Render(int texture_a, int texture_b, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTextureA", 0);
    shader_->SetUniform("uTextureB", 1);
    shader_->SetUniform("uProgress", progress);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_a);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, texture_b);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

DissolveTransition::DissolveTransition() : Transition(TransitionType::Dissolve) {}

bool DissolveTransition::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_transition_vs, g_dissolve_fs);
}

void DissolveTransition::Render(int texture_a, int texture_b, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTextureA", 0);
    shader_->SetUniform("uTextureB", 1);
    shader_->SetUniform("uProgress", progress);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_a);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, texture_b);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

SlideTransition::SlideTransition(TransitionType type) : Transition(type) {
    if (type == TransitionType::SlideLeft) direction_ = 0;
    else if (type == TransitionType::SlideRight) direction_ = 1;
    else if (type == TransitionType::SlideUp) direction_ = 2;
    else if (type == TransitionType::SlideDown) direction_ = 3;
    else direction_ = 0;
}

bool SlideTransition::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_transition_vs, g_slide_fs);
}

void SlideTransition::Render(int texture_a, int texture_b, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTextureA", 0);
    shader_->SetUniform("uTextureB", 1);
    shader_->SetUniform("uProgress", progress);
    shader_->SetUniform("uDirection", direction_);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_a);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, texture_b);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

WipeTransition::WipeTransition(TransitionType type) : Transition(type) {
    if (type == TransitionType::WipeLeft) direction_ = 0;
    else if (type == TransitionType::WipeRight) direction_ = 1;
    else direction_ = 0;
}

bool WipeTransition::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_transition_vs, g_wipe_fs);
}

void WipeTransition::Render(int texture_a, int texture_b, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTextureA", 0);
    shader_->SetUniform("uTextureB", 1);
    shader_->SetUniform("uProgress", progress);
    shader_->SetUniform("uDirection", direction_);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_a);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, texture_b);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

RippleTransition::RippleTransition() : Transition(TransitionType::Ripple) {}

bool RippleTransition::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_transition_vs, g_ripple_fs);
}

void RippleTransition::Render(int texture_a, int texture_b, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTextureA", 0);
    shader_->SetUniform("uTextureB", 1);
    shader_->SetUniform("uProgress", progress);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_a);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, texture_b);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

ZoomTransition::ZoomTransition() : Transition(TransitionType::Zoom) {}

bool ZoomTransition::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_transition_vs, g_zoom_fs);
}

void ZoomTransition::Render(int texture_a, int texture_b, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTextureA", 0);
    shader_->SetUniform("uTextureB", 1);
    shader_->SetUniform("uProgress", progress);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_a);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, texture_b);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

RotateTransition::RotateTransition() : Transition(TransitionType::Rotate) {}

bool RotateTransition::Initialize() {
    shader_ = std::make_unique<Shader>();
    return shader_->Compile(g_transition_vs, g_rotate_fs);
}

void RotateTransition::Render(int texture_a, int texture_b, const Size& size, float progress) {
    shader_->Use();
    shader_->SetUniform("uTextureA", 0);
    shader_->SetUniform("uTextureB", 1);
    shader_->SetUniform("uProgress", progress);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_a);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, texture_b);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

std::unique_ptr<Transition> TransitionFactory::Create(TransitionType type) {
    switch (type) {
        case TransitionType::Fade: return std::make_unique<FadeTransition>();
        case TransitionType::Dissolve: return std::make_unique<DissolveTransition>();
        case TransitionType::SlideLeft:
        case TransitionType::SlideRight:
        case TransitionType::SlideUp:
        case TransitionType::SlideDown:
            return std::make_unique<SlideTransition>(type);
        case TransitionType::WipeLeft:
        case TransitionType::WipeRight:
            return std::make_unique<WipeTransition>(type);
        case TransitionType::Ripple: return std::make_unique<RippleTransition>();
        case TransitionType::Zoom: return std::make_unique<ZoomTransition>();
        case TransitionType::Rotate: return std::make_unique<RotateTransition>();
        default: return nullptr;
    }
}

}
