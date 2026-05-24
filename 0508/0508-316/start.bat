@echo off
echo Starting Draw & Guess Game Server...
echo.

if not exist "cert.pem" (
    echo Certificate not found! Generating new certificate...
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
    echo.
)

echo Downloading dependencies...
go mod download

echo.
echo Starting server on https://localhost:4433
echo.
go run main.go
