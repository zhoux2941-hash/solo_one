#!/usr/bin/env python3
"""Setup script for Wireshark Plugin Suite"""

from setuptools import setup, find_packages
import os

VERSION = "1.0.0"

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read() if os.path.exists(os.path.join(here, 'README.md')) else ""

setup(
    name="wireshark-plugin-suite",
    version=VERSION,
    description="Wireshark Plugin Development Suite and Automated Analysis Engine",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Wireshark Plugin Suite Team",
    author_email="support@wireshark-plugin-suite.dev",
    url="https://github.com/wireshark-plugin-suite/wps",
    packages=find_packages(exclude=['tests*', 'examples*', 'build*', 'dist*']),
    include_package_data=True,
    package_data={
        'python': ['*.py'],
    },
    install_requires=[
        'pcapy-ng>=1.0.0',
    ],
    extras_require={
        'dev': [
            'pytest>=6.0',
            'pytest-cov>=2.0',
            'flake8>=3.8',
            'mypy>=0.800',
        ],
    },
    entry_points={
        'console_scripts': [
            'wps=python.cli:main',
        ],
    },
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Intended Audience :: Information Technology',
        'Intended Audience :: System Administrators',
        'Intended Audience :: Telecommunications Industry',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: C++',
        'Programming Language :: Lua',
        'Topic :: Software Development :: Code Generators',
        'Topic :: System :: Networking',
        'Topic :: System :: Networking :: Monitoring',
        'Topic :: Security',
    ],
    keywords="wireshark plugin lua protocol dissector network analysis pcap tcp udp",
    python_requires='>=3.7',
    project_urls={
        'Bug Reports': 'https://github.com/wireshark-plugin-suite/wps/issues',
        'Source': 'https://github.com/wireshark-plugin-suite/wps',
        'Documentation': 'https://wireshark-plugin-suite.readthedocs.io/',
    },
)
