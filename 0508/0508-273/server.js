const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

app.use('/pkg', express.static(path.join(__dirname, 'pkg')));

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.use(express.static(path.join(__dirname, 'www')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 WASM视频处理器 - 开发服务器已启动!');
    console.log('='.repeat(60));
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log('');
    console.log('⚠️  重要提示:');
    console.log('   COOP 和 COEP 头已启用，以支持 WebAssembly 多线程');
    console.log('   (SharedArrayBuffer 需要这些 HTTP 头)');
    console.log('');
    console.log('📦 项目结构:');
    console.log('   ├── src/          - Rust/WASM 源代码');
    console.log('   ├── pkg/          - 编译后的 WASM 模块');
    console.log('   ├── www/          - 前端文件 (HTML/JS)');
    console.log('   └── server.js     - 开发服务器');
    console.log('');
    console.log('🛠️  构建命令:');
    console.log('   npm run build          - 开发模式构建');
    console.log('   npm run build:release  - 生产模式构建');
    console.log('='.repeat(60));
});
