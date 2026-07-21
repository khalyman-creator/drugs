@echo off
title RawDrop - One-time setup
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\EASY-SETUP.ps1"
pause
