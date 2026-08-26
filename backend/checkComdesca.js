import { connectDB, getConnection } from './db.js';
import oracledb from 'oracledb';

async function run() {
  await connectDB();
  const conn = await getConnection();
  const result = await conn.execute(`
    SELECT DISTINCT NOMBRE_COM 
    FROM CO.CO_VW_CENTROS_DISTRIB 
    WHERE UPPER(DCA_NOM_VIG) IN ('REGISTRADO', 'SUSPENDIDO')
      AND UPPER(NOMBRE_COM) LIKE '%COMDESCA%'
  `);
  console.log('Resultados para COMDESCA:', result.rows);
  
  const result2 = await conn.execute(`
    SELECT DISTINCT NOMBRE_COM 
    FROM CO.CO_VW_CENTROS_DISTRIB 
    WHERE UPPER(DCA_NOM_VIG) IN ('REGISTRADO', 'SUSPENDIDO')
      AND UPPER(NOMBRE_COM) LIKE '%COMPAÑIA DESPACHADORA%'
  `);
  console.log('Resultados para COMPAÑIA DESPACHADORA:', result2.rows);

  const resultAll = await conn.execute(`
    SELECT DISTINCT NOMBRE_COM 
    FROM CO.CO_VW_CENTROS_DISTRIB 
    WHERE UPPER(DCA_NOM_VIG) IN ('REGISTRADO', 'SUSPENDIDO')
      AND ROWNUM <= 20
  `);
  console.log('Muestra aleatoria:', resultAll.rows);

  await conn.close();
  // Close pool
  await oracledb.getPool().close(0);
}
run();
