import oracledb from 'oracledb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getAuthDb } from '../authDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const importTerpel = async () => {
  let connection;
  let authDb;
  try {
    // Configurar cliente Oracle
    if (process.env.ORACLE_LIB_DIR) {
      oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR });
    }
    
    // Conectar a Oracle
    const conString = `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`;
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: conString
    });

    const comercializadora = process.argv[2];
    
    if (!comercializadora) {
      console.error('Por favor, proporciona el nombre de la comercializadora. Ejemplo: node importarBloque.js REXCOMER');
      process.exit(1);
    }

    console.log(`Consultando estaciones ${comercializadora} en Oracle...`);
    const query = `
      SELECT DISTINCT 
          TRIM(CEX_APELLIDO_PATERNO) || '/' || TRIM(CDI_IDENTIF) || '/' || CDI_CODIGO_SEQ AS DATO_CONCATENADO
      FROM CO.CO_VW_CENTROS_DISTRIB
      WHERE UPPER(DCA_NOM_VIG) IN ('REGISTRADO', 'SUSPENDIDO')
        AND CEX_APELLIDO_PATERNO IS NOT NULL
        AND UPPER(NOMBRE_COM) LIKE :busqueda
      ORDER BY DATO_CONCATENADO ASC
    `;
    
    const result = await connection.execute(query, { busqueda: `%${comercializadora}%` }, { outFormat: 4002 });
    
    if (result.rows && result.rows.length > 0) {
      console.log(`Se encontraron ${result.rows.length} estaciones de ${comercializadora}. Importando a SQLite...`);
      
      // Conectar a SQLite local
      authDb = await getAuthDb();
      let insertCount = 0;

      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        const dato = row.DATO_CONCATENADO;
        
        // Formatear username: sin espacios ni signos, en minúscula y agregando un índice para garantizar unicidad
        const baseUsername = dato.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
        const username = `${baseUsername}${i}`;
        const id = `ES_${comercializadora}_${i}`;

        // Insertar en la BD si no existe, o reemplazar
        await authDb.run(`
          INSERT OR REPLACE INTO usuarios (id, username, password, nombre_estacion, comercializadora)
          VALUES (?, ?, ?, ?, ?)
        `, [id, username, 'password123', dato, comercializadora]);

        insertCount++;
      }
      
      console.log(`¡Migración exitosa! Se insertaron/actualizaron ${insertCount} estaciones de ${comercializadora} en usuarios.sqlite.`);
    } else {
      console.log(`No se encontraron registros de ${comercializadora} en Oracle.`);
    }
  } catch (error) {
    console.error('Error durante la importación:', error);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión Oracle:', err);
      }
    }
    if (authDb) {
      await authDb.close();
    }
  }
};

importTerpel();
