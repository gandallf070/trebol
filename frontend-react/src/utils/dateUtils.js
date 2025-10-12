/**
 * Utilidades para formateo de fechas
 */

/**
 * Formatea una fecha en formato dd/mm/aaaa hh:mm
 * @param {string|Date} fechaString - La fecha a formatear
 * @returns {string} - Fecha formateada en formato dd/mm/aaaa hh:mm
 */
export const formatearFecha = fechaString => {
  if (!fechaString) return '';

  const fecha = new Date(fechaString);

  // Validar que la fecha sea válida
  if (isNaN(fecha.getTime())) {
    console.warn('Fecha inválida:', fechaString);
    return 'Fecha inválida';
  }

  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  const hora = fecha.getHours().toString().padStart(2, '0');
  const minuto = fecha.getMinutes().toString().padStart(2, '0');

  return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
};

/**
 * Formatea una fecha solo con día, mes y año (sin hora)
 * @param {string|Date} fechaString - La fecha a formatear
 * @returns {string} - Fecha formateada en formato dd/mm/aaaa
 */
export const formatearFechaSoloFecha = fechaString => {
  if (!fechaString) return '';

  const fecha = new Date(fechaString);

  // Validar que la fecha sea válida
  if (isNaN(fecha.getTime())) {
    console.warn('Fecha inválida:', fechaString);
    return 'Fecha inválida';
  }

  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
};

/**
 * Limpia el caché del navegador para forzar la recarga de archivos
 */
export const limpiarCacheNavegador = () => {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }

  // Forzar recarga de la página
  window.location.reload(true);
};

/**
 * Convierte una fecha de formato dd/mm/aaaa a Date object
 * @param {string} fechaString - Fecha en formato dd/mm/aaaa
 * @returns {Date|null} - Objeto Date o null si es inválido
 */
export const parsearFechaDDMMAAAA = fechaString => {
  if (!fechaString) return null;

  const partes = fechaString.split('/');
  if (partes.length !== 3) return null;

  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1; // Los meses en JS van de 0-11
  const anio = parseInt(partes[2], 10);

  if (isNaN(dia) || isNaN(mes) || isNaN(anio)) return null;

  return new Date(anio, mes, dia);
};
