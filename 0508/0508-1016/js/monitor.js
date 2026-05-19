class MonitorWindow {
    constructor() {
        this.window = null;
        this.isOpen = false;
    }

    open(stream) {
        if (this.isOpen) {
            this.focus();
            return;
        }

        const width = 960;
        const height = 540;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        this.window = window.open(
            '',
            'MonitorWindow',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
        );

        if (!this.window) {
            alert('无法打开监控窗口，请检查浏览器的弹窗阻止设置');
            return;
        }

        this.window.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>实时监控 - 导播台输出</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background: #000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100vw;
                        height: 100vh;
                        overflow: hidden;
                    }
                    video {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                    .overlay {
                        position: fixed;
                        top: 10px;
                        left: 10px;
                        background: rgba(0, 0, 0, 0.7);
                        color: #fff;
                        padding: 8px 12px;
                        border-radius: 5px;
                        font-family: monospace;
                        font-size: 12px;
                        z-index: 10;
                    }
                    .live-indicator {
                        display: inline-block;
                        width: 8px;
                        height: 8px;
                        background: #ff0000;
                        border-radius: 50%;
                        margin-right: 8px;
                        animation: pulse 1s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                </style>
            </head>
            <body>
                <div class="overlay">
                    <span class="live-indicator"></span>
                    <span id="status">LIVE - 实时监控</span>
                </div>
                <video id="monitorVideo" autoplay playsinline controls></video>
            </body>
            </html>
        `);

        this.window.document.close();

        setTimeout(() => {
            const video = this.window.document.getElementById('monitorVideo');
            if (video && stream) {
                video.srcObject = stream;
            }
        }, 100);

        this.isOpen = true;

        this.window.onbeforeunload = () => {
            this.isOpen = false;
            this.window = null;
        };

        this.window.addEventListener('resize', () => {
            if (this.window) {
                const video = this.window.document.getElementById('monitorVideo');
                if (video) {
                    video.style.width = '100%';
                    video.style.height = '100%';
                }
            }
        });
    }

    close() {
        if (this.window && !this.window.closed) {
            this.window.close();
        }
        this.isOpen = false;
        this.window = null;
    }

    focus() {
        if (this.window && !this.window.closed) {
            this.window.focus();
        }
    }

    updateStream(stream) {
        if (this.isOpen && this.window && !this.window.closed) {
            const video = this.window.document.getElementById('monitorVideo');
            if (video) {
                video.srcObject = stream;
            }
        }
    }

    getIsOpen() {
        return this.isOpen && this.window && !this.window.closed;
    }
}

window.MonitorWindow = MonitorWindow;
