export const getEstaciones = () => {
  return [
    { id: 1, nombre: "Estación Norte" },
    { id: 2, nombre: "Estación Sur" },
    { id: 3, nombre: "Estación Central" },
  ];
};

export const getCentrosDistribucion = (estacionId) => {
  const centros = {
    1: [
      { id: 101, nombre: "Centro Distribución Norte A" },
      { id: 102, nombre: "Centro Distribución Norte B" },
    ],
    2: [
      { id: 201, nombre: "Centro Distribución Sur A" },
    ],
    3: [
      { id: 301, nombre: "Centro Distribución Central Principal" },
      { id: 302, nombre: "Centro Distribución Central Secundario" },
    ],
  };
  return centros[estacionId] || [];
};
