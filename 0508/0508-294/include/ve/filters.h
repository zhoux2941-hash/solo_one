#pragma once

#include "ve/types.h"
#include "ve/renderer.h"
#include <map>

namespace ve {

class VE_API Filter {
public:
    Filter(FilterType type);
    virtual ~Filter();
    
    FilterType GetType() const;
    
    virtual bool Initialize();
    virtual void Release();
    
    virtual void Apply(int input_texture, const Size& size, float progress = 1.0f);
    
    void SetParam(const std::string& name, float value);
    float GetParam(const std::string& name, float default_value = 0.0f) const;
    
protected:
    FilterType type_;
    std::map<std::string, float> params_;
    std::unique_ptr<Shader> shader_;
};

class VE_API FilterChain {
public:
    FilterChain();
    ~FilterChain();
    
    bool Initialize(const Size& size);
    void Shutdown();
    
    void AddFilter(std::shared_ptr<Filter> filter);
    void RemoveFilter(int index);
    void Clear();
    
    int GetFilterCount() const;
    std::shared_ptr<Filter> GetFilter(int index) const;
    
    int Process(int input_texture);
    
    int GetOutputTexture() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API BrightnessFilter : public Filter {
public:
    BrightnessFilter();
    bool Initialize() override;
    void Apply(int input_texture, const Size& size, float progress = 1.0f) override;
};

class VE_API ContrastFilter : public Filter {
public:
    ContrastFilter();
    bool Initialize() override;
    void Apply(int input_texture, const Size& size, float progress = 1.0f) override;
};

class VE_API SaturationFilter : public Filter {
public:
    SaturationFilter();
    bool Initialize() override;
    void Apply(int input_texture, const Size& size, float progress = 1.0f) override;
};

class VE_API GaussianBlurFilter : public Filter {
public:
    GaussianBlurFilter();
    bool Initialize() override;
    void Apply(int input_texture, const Size& size, float progress = 1.0f) override;
};

class VE_API SharpenFilter : public Filter {
public:
    SharpenFilter();
    bool Initialize() override;
    void Apply(int input_texture, const Size& size, float progress = 1.0f) override;
};

class VE_API SepiaFilter : public Filter {
public:
    SepiaFilter();
    bool Initialize() override;
    void Apply(int input_texture, const Size& size, float progress = 1.0f) override;
};

class VE_API VignetteFilter : public Filter {
public:
    VignetteFilter();
    bool Initialize() override;
    void Apply(int input_texture, const Size& size, float progress = 1.0f) override;
};

}
