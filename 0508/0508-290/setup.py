from setuptools import setup, find_packages

setup(
    name="numpyjit",
    version="0.1.0",
    description="JIT compiler for NumPy-like DSL",
    author="Your Name",
    packages=find_packages(),
    install_requires=[
        "ply>=3.11",
        "llvmlite>=0.42.0",
        "numpy>=1.24.0",
        "cffi>=1.15.0",
    ],
    python_requires=">=3.9",
)
