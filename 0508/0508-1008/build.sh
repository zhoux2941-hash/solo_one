#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$PROJECT_DIR/build"

echo "=== MemSafetyAnalyzer Build Script ==="
echo ""

if [ -d "$BUILD_DIR" ]; then
    echo "Cleaning existing build directory..."
    rm -rf "$BUILD_DIR"
fi

echo "Creating build directory..."
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

echo "Configuring with CMake..."
cmake "$PROJECT_DIR"

echo ""
echo "Building project..."
make -j$(nproc)

echo ""
echo "=== Build completed successfully! ==="
echo "Binary location: $BUILD_DIR/memsafety"
echo ""
echo "Run tests with:"
echo "  cd $PROJECT_DIR/tests"
echo "  $BUILD_DIR/memsafety test_null_pointer.c"
