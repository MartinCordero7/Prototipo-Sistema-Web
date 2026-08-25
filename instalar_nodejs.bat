@echo off
echo =======================================================
echo Instalador de Node.js
echo =======================================================
echo.
echo Descargando e instalando la version recomendada de Node.js...
echo.
echo ATENCION: Es muy probable que Windows te pida permisos de Administrador.
echo Por favor, haz clic en "Si" cuando aparezca la ventana emergente.
echo.

winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

echo.
echo =======================================================
echo Proceso finalizado. 
echo NOTA: Para que los comandos npm y node funcionen correctamente,
echo debes cerrar y volver a abrir cualquier ventana de terminal o consola.
echo =======================================================
pause

