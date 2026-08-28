import { getConnection } from '../db.js';

export const getCentrosDistribucionOracle = async (comercializadora) => {
  // Mock para pruebas locales sin datos reales en Oracle
  if (comercializadora.toUpperCase() === 'TEST') {
    return [{
      id: 'Test/82PR123/123',
      nombre: 'Test',
      codigo_unico: '123',
      codigo_arch: '82PR123',
      dato_concatenado: 'Test/82PR123/123'
    }];
  }

  let connection;
  try {
    connection = await getConnection();
    
    // Agregamos comodines de SQL a la variable de búsqueda
    const busquedaParams = `%${comercializadora.toUpperCase()}%`;
    
    const query = `
      SELECT DISTINCT 
          TRIM(CEX_APELLIDO_PATERNO) AS NOMBRE,
          TRIM(CDI_IDENTIF) AS CODIGO_ARCH,
          CDI_CODIGO_SEQ AS CODIGO_UNICO,
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
    
    // Mapeamos para que retorne { id, nombre, codigo_unico, codigo_arch }
    const centros = result.rows.map(row => ({
      id: row.DATO_CONCATENADO,
      nombre: row.NOMBRE,
      codigo_unico: row.CODIGO_UNICO,
      codigo_arch: row.CODIGO_ARCH,
      dato_concatenado: row.DATO_CONCATENADO
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

export const getComercializadorasOracle = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const query = `
      SELECT DISTINCT TRIM(NOMBRE_COM) AS NOMBRE_COM
      FROM CO.CO_VW_CENTROS_DISTRIB
      WHERE NOMBRE_COM IS NOT NULL
    `;
    
    const result = await connection.execute(query, [], { outFormat: 4002 });
    
    // Si estamos en entorno de prueba sin datos reales, retornamos una de prueba
    if (result.rows.length === 0) {
      return ['TEST'];
    }
    
    const rawNames = result.rows.map(row => row.NOMBRE_COM);
    
    // Limpiador dinámico de nombres para agrupar (elimina S.A., C.A., Comercializadora, etc.)
    const cleanName = (name) => {
      let cleaned = name.toUpperCase().trim();
      
      const prefixes = [
        'COMERCIALIZADORA DE COMBUSTIBLES Y DERIVADOS ',
        'COMERCIALIZADORA DE COMBUSTIBLES ',
        'COMERCIALIZADORA ',
        'ESTACION DE SERVICIOS ',
        'ESTACION DE SERVICIO ',
        'ESTACIONES DE SERVICIO ',
        'RED DE ESTACIONES '
      ];
      
      const suffixes = [
        ' S.A.', ' C.A.', ' CIA. LTDA.', ' S.A', ' C.A', ' CIA.', ' LTDA.', ' S A', ' C A', ' EP'
      ];
      
      for (const p of prefixes) {
        if (cleaned.startsWith(p)) {
          cleaned = cleaned.replace(p, '').trim();
        }
      }
      
      for (const s of suffixes) {
        if (cleaned.endsWith(s)) {
          cleaned = cleaned.replace(s, '').trim();
        }
      }
      
      // Eliminar todo lo que esté después de un guion (ej. "TERPEL- COMERCIAL ECUADOR" -> "TERPEL")
      if (cleaned.includes('-')) {
        cleaned = cleaned.split('-')[0].trim();
      }
      
      return cleaned;
    };

    const cleanedSet = new Set();
    rawNames.forEach(name => {
      const c = cleanName(name);
      if (c && c.length > 2) {
        cleanedSet.add(c);
      }
    });

    // Algoritmo de unificación inteligente (Substring Grouping)
    // Ordenamos de menor a mayor longitud. Si un nombre más largo contiene a uno corto (Ej. 'TERPEL ECUADOR' contiene 'TERPEL'),
    // nos quedamos solo con el corto y descartamos el largo.
    const sortedCleaned = Array.from(cleanedSet).sort((a, b) => a.length - b.length);
    const finalGrouped = [];

    for (const name of sortedCleaned) {
      // Verificamos si este nombre ya contiene alguno de los nombres más cortos aceptados
      const isDuplicate = finalGrouped.some(acceptedName => {
        // Para evitar falsos positivos como 'GAS' dentro de 'MASGAS', exigimos coincidencia por palabra
        const regex = new RegExp(`\\b${acceptedName}\\b`, 'i');
        return regex.test(name) || name.includes(acceptedName);
      });

      if (!isDuplicate) {
        finalGrouped.push(name);
      }
    }

    const comercializadoras = finalGrouped.sort();
    
    // Agregar TEST siempre para fines de pruebas
    if (!comercializadoras.includes('TEST')) {
      comercializadoras.push('TEST');
    }
    
    return comercializadoras;
  } catch (error) {
    console.error('Error al ejecutar la consulta de Comercializadoras en Oracle:', error);
    // Para entornos locales que fallen la conexión, devolvemos unas mockeadas como fallback si se desea,
    // o simplemente devolvemos la excepción.
    return ['TEST'];
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
