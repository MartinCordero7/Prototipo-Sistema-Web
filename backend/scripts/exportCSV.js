import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../usuarios.sqlite');

const exportCSV = async () => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const rows = await db.all('SELECT comercializadora, nombre_estacion, username, password FROM usuarios ORDER BY comercializadora, nombre_estacion');
    
    // Cabeceras del CSV
    let csvContent = 'Comercializadora,Estacion_Real,Usuario,Contrasena_Asignada\n';
    
    for (const row of rows) {
      // Escapamos con comillas por si acaso algún nombre contiene comas
      csvContent += `"${row.comercializadora}","${row.nombre_estacion}","${row.username}","${row.password}"\n`;
    }

    // Lo guardaremos directamente en la raíz de la carpeta del proyecto para fácil acceso
    const outputPath = path.join(__dirname, '../../Directorio_Usuarios.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    
    console.log('¡CSV exportado con éxito en: ' + outputPath + '!');
    
    await db.close();
  } catch (error) {
    console.error('Error exportando CSV:', error);
  }
};

exportCSV();
