#pragma once

#include "ve/types.h"
#include "ve/editor.h"
#include "ve/renderer.h"
#include "ve/decoder.h"
#include "ve/encoder.h"
#include "ve/filters.h"
#include "ve/transitions.h"
#include "ve/audio.h"

namespace ve {

VE_API bool Initialize();
VE_API void Shutdown();
VE_API const char* GetVersion();

}
