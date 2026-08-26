import { getConnection } from '../db.js';

export const getCentrosDistribucionOracle = async (comercializadora) => {
  let connection;
  try {
    connection = await getConnection();
    
    // Agregamos comodines de SQL a la variable de búsqueda
    const busquedaParams = `%${comercializadora.toUpperCase()}%`;
    
    const query = `
      SELECT DISTINCT 
          TRIM(CEX_APELLIDO_PATERNO) || '/' || TRIM(CDI_IDENTIF) || '/' || CDI_CODIGO_SEQ AS DATO_CONCATENADO
      FROM CO.CO_VW_CENTROS_DISTRIB
      WHERE UPPER(DCA_NOM_VIG) IN ('REGISTRADO', 'SUSPENDIDO')
        AND CEX_APELLIDO_PATERNO IS NOT NULL
        AND UPPER(NOMBRE_COM) LIKE :busqueda
      ORDER BY DATO_CONCATENADO ASC
    `;
    
    // oracledb por defecto retorna array de arrays si no se especifica outFormat.
    // Usamos outFormat: 4002 (OBJECT)
    const result = await connection.execute(query, { busqueda: busquedaParams }, { outFormat: 4002 });
    
    // Mapeamos para que retorne { id, nombre }
    const centros = result.rows.map(row => ({
      id: row.DATO_CONCATENADO,
      nombre: row.DATO_CONCATENADO
    }));
    
    return centros;
  } catch (error) {
    console.error('Error al ejecutar la consulta de Centros en Oracle:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};

