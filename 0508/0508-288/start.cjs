const { execSync } = require('child_process');

console.log('Starting dev server...');
try {
    execSync('node node_modules/vite/bin/vite.js', { stdio: 'inherit' });
} catch (e) {
    console.error('Failed to start server');
}
