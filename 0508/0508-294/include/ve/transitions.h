#pragma once

#include "ve/types.h"
#include "ve/renderer.h"

namespace ve {

class VE_API Transition {
public:
    Transition(TransitionType type);
    virtual ~Transition();
    
    TransitionType GetType() const;
    
    virtual bool Initialize();
    virtual void Release();
    
    virtual void Render(int texture_a, int texture_b, const Size& size, float progress);
    
protected:
    TransitionType type_;
    std::unique_ptr<Shader> shader_;
};

class VE_API FadeTransition : public Transition {
public:
    FadeTransition();
    bool Initialize() override;
    void Render(int texture_a, int texture_b, const Size& size, float progress) override;
};

class VE_API DissolveTransition : public Transition {
public:
    DissolveTransition();
    bool Initialize() override;
    void Render(int texture_a, int texture_b, const Size& size, float progress) override;
};

class VE_API SlideTransition : public Transition {
public:
    explicit SlideTransition(TransitionType type);
    bool Initialize() override;
    void Render(int texture_a, int texture_b, const Size& size, float progress) override;
    
private:
    int direction_;
};

class VE_API WipeTransition : public Transition {
public:
    explicit WipeTransition(TransitionType type);
    bool Initialize() override;
    void Render(int texture_a, int texture_b, const Size& size, float progress) override;
    
private:
    int direction_;
};

class VE_API RippleTransition : public Transition {
public:
    RippleTransition();
    bool Initialize() override;
    void Render(int texture_a, int texture_b, const Size& size, float progress) override;
};

class VE_API ZoomTransition : public Transition {
public:
    ZoomTransition();
    bool Initialize() override;
    void Render(int texture_a, int texture_b, const Size& size, float progress) override;
};

class VE_API RotateTransition : public Transition {
public:
    RotateTransition();
    bool Initialize() override;
    void Render(int texture_a, int texture_b, const Size& size, float progress) override;
};

class VE_API TransitionFactory {
public:
    static std::unique_ptr<Transition> Create(TransitionType type);
};

}
