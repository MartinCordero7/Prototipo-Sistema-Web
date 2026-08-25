require('dotenv').config();
const oracledb = require('oracledb');

async function checkConnection() {
  let connection;
  try {
    if (process.env.ORACLE_LIB_DIR) {
      oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR });
    }
    const conString = process.env.ORACLE_HOST + ':' + process.env.ORACLE_PORT + '/' + process.env.ORACLE_SERVICE_NAME;
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: conString
    });
    console.log('¡Conexión a Oracle DB exitosa!');
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('Fecha en el servidor Oracle:', result.rows[0][0]);
  } catch (err) {
    console.error('Error conectando a Oracle DB:', err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
}
checkConnection();
