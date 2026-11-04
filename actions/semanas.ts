'use server';

// Auxiliar para obtener la fecha del lunes actual (YYYY-MM-DD)
export function getLunesActual(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(d.setDate(diff));
  return lunes.toISOString().split("T")[0];
}

export async function getGastosAnteriores(profileId: number) {
  const fechaLunes = getLunesActual();
  return { fechaLunes, profileId };
}