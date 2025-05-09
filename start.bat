@echo off
title Sistema DosToc - Inicializador
color 1F
chcp 65001 >nul

:: INICIAR O SERVIDOR EM SEGUNDO PLANO
start "" /B cmd /C "tsx watch app.ts"

:: SPLASH SCREEN ANIMADA
echo.
echo =====================================================
echo.
echo        BEM-VINDO AO SISTEMA DOSTOC
echo.
echo        Iniciando o sistema, aguarde...
echo.
echo =====================================================
echo.
ping localhost -n 2 >nul
echo [■□□□□□□□□□] 10%%
ping localhost -n 2 >nul
echo Estabelecendo conexões
echo [■■□□□□□□□□] 20%%
ping localhost -n 2 >nul
echo [■■■□□□□□□□] 30%%
ping localhost -n 2 >nul
echo [■■■■□□□□□□] 40%%
ping localhost -n 2 >nul
echo Estabilizando servidor
echo [■■■■■□□□□□] 50%%
ping localhost -n 2 >nul
echo [■■■■■■□□□□] 60%%
ping localhost -n 2 >nul
echo [■■■■■■■□□□] 70%%
ping localhost -n 2 >nul
echo Carregando páginas
echo [■■■■■■■■□□] 80%%
ping localhost -n 2 >nul
echo [■■■■■■■■■□] 90%%
ping localhost -n 2 >nul
echo [■■■■■■■■■■] 100%%
echo.
echo =====================================================
echo             Sistema iniciado com sucesso!
echo =====================================================
echo.
echo Para ENCERRAR o programa, basta fechar a guia do navegador
echo e em seguida, fechar este terminal.

:: ABRIR O NAVEGADOR
start http://localhost:8088

:: FINALIZA ESSE TERMINAL (o servidor segue rodando no fundo)
exit
