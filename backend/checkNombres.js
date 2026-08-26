import oracledb from 'oracledb';
import { getConnection } from './db.js';

async function test() {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute("SELECT DISTINCT NOMBRE_COM FROM CO.CO_VW_CENTROS_DISTRIB WHERE UPPER(DCA_NOM_VIG) IN ('REGISTRADO', 'SUSPENDIDO')");
    console.log(result.rows);
  } catch(e) {
    console.error(e);
  } finally {
    if(conn) await conn.close();
  }
}
test();
