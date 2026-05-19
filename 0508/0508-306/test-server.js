// 简单的 WebSocket 测试服务器，用于测试多路推流功能
const WebSocket = require('ws');

const PORT = 8000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket 测试服务器运行在 ws://localhost:${PORT}`);
console.log(`📊 用于测试多路推流功能\n`);

let totalBytesReceived = 0;
let startTime = Date.now();

wss.on('connection', (ws, req) => {
    const clientId = req.socket.remoteAddress + ':' + req.socket.remotePort;
    console.log(`✅ 新客户端连接: ${clientId}`);
    
    let clientBytes = 0;
    let videoPackets = 0;
    let audioPackets = 0;

    ws.on('message', (data) => {
        totalBytesReceived += data.length;
        clientBytes += data.length;

        if (data[0] === 0x00) {
            videoPackets++;
        } else if (data[0] === 0x01) {
            audioPackets++;
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const bitrate = Math.round((totalBytesReceived * 8) / elapsed / 1000);
        
        process.stdout.write(
            `\r📦 总接收: ${(totalBytesReceived / 1024 / 1024).toFixed(2)} MB | ` +
            `码率: ${bitrate} kbps | ` +
            `视频包: ${videoPackets} | ` +
            `音频包: ${audioPackets} | ` +
            `连接数: ${wss.clients.size}`
        );
    });

    ws.on('close', () => {
        console.log(`\n❌ 客户端断开: ${clientId} (接收 ${(clientBytes / 1024).toFixed(2)} KB)`);
    });

    ws.on('error', (error) => {
        console.log(`\n⚠️  错误: ${error.message}`);
    });
});

wss.on('error', (error) => {
    console.log(`服务器错误: ${error.message}`);
});

console.log(`等待客户端连接...\n`);
