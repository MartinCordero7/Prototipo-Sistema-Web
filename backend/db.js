import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config();

// Inicializamos el cliente de Oracle.
// Usamos el modo Thick si se ha definido ORACLE_LIB_DIR en el .env
try {
  if (process.env.ORACLE_LIB_DIR) {
    oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR });
    console.log(`Oracle client inicializado en modo Thick (${process.env.ORACLE_LIB_DIR})`);
  } else {
    console.log('Oracle client inicializado en modo Thin');
  }
} catch (err) {
  console.error('Error inicializando el cliente de Oracle:', err);
}

// Configuración del pool de conexiones
export const connectDB = async () => {
  try {
    const conString = `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`;
    
    await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: conString,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });

    console.log('¡Pool de conexiones a Oracle DB creado exitosamente!');
  } catch (err) {
    console.error('Error creando el pool de conexiones a Oracle DB:', err);
    process.exit(1);
  }
};

// Función para obtener una conexión del pool y ejecutar consultas
export const getConnection = async () => {
  try {
    const connection = await oracledb.getConnection();
    return connection;
  } catch (error) {
    console.error('Error al obtener la conexión de Oracle DB:', error);
    throw error;
  }
};
