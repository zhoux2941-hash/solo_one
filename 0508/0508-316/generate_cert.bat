@echo off
echo Generating self-signed certificate for WebTransport...
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
echo Certificate generated: cert.pem and key.pem
pause
