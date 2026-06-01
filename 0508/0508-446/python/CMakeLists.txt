find_package(Python3 COMPONENTS Interpreter Development)

if(Python3_FOUND)
    install(PROGRAMS wps_plugin_manager.py
            DESTINATION bin
            RENAME wps)
            
    install(DIRECTORY .
            DESTINATION python/wireshark_plugin_suite
            FILES_MATCHING PATTERN "*.py"
            PATTERN "__pycache__" EXCLUDE)
endif()
