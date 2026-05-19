#include "ve/renderer.h"
#include <glad/glad.h>

namespace ve {

class Shader::Impl {
public:
    Impl() : program_(0) {}
    ~Impl() { Release(); }
    
    bool Compile(const char* vertex_source, const char* fragment_source) {
        unsigned int vs = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vs, 1, &vertex_source, nullptr);
        glCompileShader(vs);
        
        int success;
        char infoLog[512];
        glGetShaderiv(vs, GL_COMPILE_STATUS, &success);
        if (!success) {
            glGetShaderInfoLog(vs, 512, nullptr, infoLog);
            return false;
        }
        
        unsigned int fs = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fs, 1, &fragment_source, nullptr);
        glCompileShader(fs);
        
        glGetShaderiv(fs, GL_COMPILE_STATUS, &success);
        if (!success) {
            glGetShaderInfoLog(fs, 512, nullptr, infoLog);
            glDeleteShader(vs);
            return false;
        }
        
        program_ = glCreateProgram();
        glAttachShader(program_, vs);
        glAttachShader(program_, fs);
        glLinkProgram(program_);
        
        glGetProgramiv(program_, GL_LINK_STATUS, &success);
        if (!success) {
            glGetProgramInfoLog(program_, 512, nullptr, infoLog);
            glDeleteShader(vs);
            glDeleteShader(fs);
            return false;
        }
        
        glDeleteShader(vs);
        glDeleteShader(fs);
        return true;
    }
    
    void Release() {
        if (program_) {
            glDeleteProgram(program_);
            program_ = 0;
        }
    }
    
    void Use() {
        glUseProgram(program_);
    }
    
    void SetUniform(const char* name, float value) {
        glUniform1f(glGetUniformLocation(program_, name), value);
    }
    
    void SetUniform(const char* name, const Vec2& value) {
        glUniform2f(glGetUniformLocation(program_, name), value.x, value.y);
    }
    
    void SetUniform(const char* name, const Vec3& value) {
        glUniform3f(glGetUniformLocation(program_, name), value.x, value.y, value.z);
    }
    
    void SetUniform(const char* name, const Color& value) {
        glUniform4f(glGetUniformLocation(program_, name), value.r, value.g, value.b, value.a);
    }
    
    void SetUniform(const char* name, int value) {
        glUniform1i(glGetUniformLocation(program_, name), value);
    }
    
    void SetUniformMatrix4(const char* name, const float* matrix) {
        glUniformMatrix4fv(glGetUniformLocation(program_, name), 1, GL_FALSE, matrix);
    }
    
    unsigned int GetId() const { return program_; }
    
private:
    unsigned int program_;
};

Shader::Shader() : impl_(std::make_unique<Impl>()) {}
Shader::~Shader() = default;
bool Shader::Compile(const char* vertex_source, const char* fragment_source) { return impl_->Compile(vertex_source, fragment_source); }
void Shader::Release() { impl_->Release(); }
void Shader::Use() { impl_->Use(); }
void Shader::SetUniform(const char* name, float value) { impl_->SetUniform(name, value); }
void Shader::SetUniform(const char* name, const Vec2& value) { impl_->SetUniform(name, value); }
void Shader::SetUniform(const char* name, const Vec3& value) { impl_->SetUniform(name, value); }
void Shader::SetUniform(const char* name, const Color& value) { impl_->SetUniform(name, value); }
void Shader::SetUniform(const char* name, int value) { impl_->SetUniform(name, value); }
void Shader::SetUniformMatrix4(const char* name, const float* matrix) { impl_->SetUniformMatrix4(name, matrix); }
unsigned int Shader::GetId() const { return impl_->GetId(); }

}
