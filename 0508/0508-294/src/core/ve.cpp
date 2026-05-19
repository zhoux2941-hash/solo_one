#include "ve/ve.h"
#include "ve/utils/logger.h"

#ifdef _WIN32
#include <windows.h>
#endif

namespace ve {

static bool s_initialized = false;

bool Initialize() {
    if (s_initialized) return true;
    
    VE_LOG_INFO("Initializing VideoEditor SDK v1.0.0");
    
#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
#endif
    
    VE_LOG_INFO("VideoEditor SDK initialized successfully");
    s_initialized = true;
    return true;
}

void Shutdown() {
    if (!s_initialized) return;
    
    VE_LOG_INFO("Shutting down VideoEditor SDK");
    
#ifdef _WIN32
    WSACleanup();
#endif
    
    s_initialized = false;
}

const char* GetVersion() {
    return "1.0.0";
}

}
