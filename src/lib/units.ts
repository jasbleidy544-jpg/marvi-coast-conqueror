// La base de datos guarda toneladas; la interfaz muestra kilos.
export const tonsToKg = (tons: number | string | null | undefined) => Number(tons ?? 0) * 1000;

export const fmtKg = (tons: number | string | null | undefined, decimals = 0) =>
  tonsToKg(tons).toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
