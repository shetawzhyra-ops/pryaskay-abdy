@echo off
chcp 65001 >nul
title پلاتفۆرمی فێرگە - Local Server
cd /d "%~dp0"
echo دەستپێکردنی سێرڤەری فێرگە...
start http://localhost:5000
node server.js
pause
