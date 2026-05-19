const { execSync } = require('child_process');

console.log('Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies installed successfully!');
} catch (e) {
    console.error('Failed to install dependencies');
}
