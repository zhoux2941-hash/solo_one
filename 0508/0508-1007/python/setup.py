from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext
import sys
import os
import subprocess

class CMakeBuild(build_ext):
    def run(self):
        try:
            out = subprocess.check_output(['cmake', '--version'])
        except OSError:
            raise RuntimeError("CMake must be installed to build the extension")

        for ext in self.extensions:
            self.build_extension(ext)

    def build_extension(self, ext):
        extdir = os.path.abspath(os.path.dirname(self.get_ext_fullpath(ext.name)))
        cmake_args = [
            '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + extdir,
            '-DPYTHON_EXECUTABLE=' + sys.executable,
            '-DBUILD_PYTHON_BINDINGS=ON',
            '-DBUILD_EXAMPLES=OFF',
            '-DUSE_INT8_QUANTIZATION=ON'
        ]

        build_args = ['--config', 'Release']

        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)

        subprocess.check_call(['cmake', ext.sourcedir] + cmake_args, cwd=self.build_temp)
        subprocess.check_call(['cmake', '--build', '.'] + build_args, cwd=self.build_temp)

setup(
    name='py_hand_tracking_sdk',
    version='1.0.0',
    author='MediaPipe Hand Tracking SDK',
    description='MediaPipe based real-time hand tracking SDK with gesture recognition',
    long_description=open('../README.md').read(),
    long_description_content_type='text/markdown',
    ext_modules=[Extension('py_hand_tracking_sdk', sources=[])],
    cmdclass=dict(build_ext=CMakeBuild),
    zip_safe=False,
    python_requires='>=3.7',
    install_requires=[
        'numpy>=1.19.0',
        'opencv-python>=4.5.0'
    ],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: C++',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Operating System :: Microsoft :: Windows',
        'Operating System :: POSIX :: Linux',
        'Operating System :: Android',
        'Operating System :: iOS'
    ]
)
