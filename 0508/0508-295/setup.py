from setuptools import setup, find_packages

setup(
    name="usb-fingerprint",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "pyusb>=1.2.1",
        "libusb1>=3.0.0",
        "scikit-learn>=1.3.0",
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "fastapi>=0.100.0",
        "uvicorn>=0.23.2",
        "sqlalchemy>=2.0.0",
        "pydantic>=2.0.0",
        "click>=8.0.0",
        "joblib>=1.3.0",
        "scipy>=1.10.0",
    ],
    entry_points={
        "console_scripts": [
            "usb-fingerprint=usb_fingerprint.cli:main",
        ],
    },
    author="USB Fingerprint Team",
    description="USB Device Fingerprint Recognition System",
    python_requires=">=3.8",
)
