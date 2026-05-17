// Promisified geolocation helper.
export interface Coords { lat: number; lng: number; accuracy: number }

export const getCurrentPosition = (): Promise<Coords> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tu dispositivo no soporta GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED ? 'Permiso de ubicación denegado. Actívalo en tu navegador.' :
          err.code === err.POSITION_UNAVAILABLE ? 'No se pudo obtener tu ubicación.' :
          err.code === err.TIMEOUT ? 'Tiempo de espera agotado al obtener GPS.' :
          'Error de GPS.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
