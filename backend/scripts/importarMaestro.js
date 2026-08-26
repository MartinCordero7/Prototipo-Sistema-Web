import oracledb from 'oracledb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getAuthDb } from '../authDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const importarMaestro = async () => {
  let connection;
  let authDb;
  try {
    if (process.env.ORACLE_LIB_DIR) {
      oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR });
    }
    
    const conString = `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`;
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: conString
    });

    // Lista definitiva
    const comercializadoras = [
      'Clyan', 'Comdesca', 'Copedesa', 'Ecucomsa', 'Energy Lider', 
      'Energygas', 'Ep petroecuador', 'Gaspetrolium', 'Lisroni', 
      'Masgas', 'Pdv Ecuador', 'Petroleos y servicios', 'Petrolrios', 
      'Petromar', 'PetroWorld', 'Primax', 'Rexcomer', 'Servioil', 'Terpel'
    ];

    authDb = await getAuthDb();
    
    // Limpiamos la base de datos para no tener basura del listado anterior
    await authDb.run('DELETE FROM usuarios');
    console.log('Se limpió la base de datos local para importar la lista definitiva.');
    
    let totalInsertadosGlobal = 0;

    for (let i = 0; i < comercializadoras.length; i++) {
      // Pasamos a mayúsculas porque Oracle LIKE es sensible a mayúsculas en algunos esquemas, 
      // aunque ya usamos UPPER() en el script original.
      const comercializadora = comercializadoras[i].toUpperCase();
      console.log(`\nConsultando estaciones ${comercializadora} en Oracle...`);
      
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
        let insertCount = 0;

        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows[i];
          const dato = row.DATO_CONCATENADO;
          
          const baseUsername = dato.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
          const username = `${baseUsername}${comercializadora.substring(0, 2).toLowerCase()}${i}`;
          const id = `ES_${comercializadora.replace(/\s/g, '_')}_${i}`;

          await authDb.run(`
            INSERT OR REPLACE INTO usuarios (id, username, password, nombre_estacion, comercializadora)
            VALUES (?, ?, ?, ?, ?)
          `, [id, username, 'password123', dato, comercializadora]);

          insertCount++;
          totalInsertadosGlobal++;
        }
        
        console.log(`✓ Insertadas/Actualizadas ${insertCount} estaciones de ${comercializadora}.`);
      } else {
        console.log(`- No se encontraron estaciones de ${comercializadora}.`);
      }
    }

    console.log(`\n¡PROCESO MAESTRO COMPLETADO! Total de estaciones procesadas: ${totalInsertadosGlobal}`);

  } catch (error) {
    console.error('Error durante la importación maestra:', error);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
    if (authDb) {
      await authDb.close();
    }
  }
};

importarMaestro();
