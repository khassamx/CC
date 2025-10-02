// utils.js

// Definimos los nombres base para los primeros 10 rangos
const RANGO_NOMBRES = {
    1: 'Novato',
    2: 'Explorador',
    3: 'Aprendiz',
    4: 'Caminante',
    5: 'Guerrero',
    6: 'Defensor',
    7: 'Viajero',
    8: 'Sabio',
    9: 'Maestro',
    10: 'Leyenda',
    30: 'Veterano ✨',
    50: 'TRASCENDENTAL 👑'
};

/**
 * Calcula el nivel (rango) de un usuario basado en el total de mensajes.
 * La curva de experiencia es logarítmica (los niveles altos son más difíciles).
 * @param {number} totalMessages - El número total de mensajes enviados.
 * @returns {string} El nombre del rango con el formato: "Rango X - Nombre"
 */
function getRango(totalMessages) {
    if (totalMessages < 1) return 'Rango 1 - Novato';

    // Curva de crecimiento: Logarítmica para 50 niveles
    // El nivel 50 se alcanza con aproximadamente 5000 mensajes
    const MAX_LEVEL = 50;
    const FACTOR = 0.01;
    const OFFSET = 50; // Mensajes iniciales para empezar la subida

    // Fórmula Sigmoidal para acercarse a 50 lentamente
    let level = Math.floor(MAX_LEVEL / (1 + Math.exp(-FACTOR * (totalMessages - OFFSET))));

    // Asegurar que no exceda 50
    if (level > MAX_LEVEL) {
        level = MAX_LEVEL;
    } else if (level < 1) {
        level = 1;
    }
    
    // Asignar el nombre del rango
    let rangoNombre = RANGO_NOMBRES[level] || `Nivel ${level}`;

    // Si el nivel está entre 11 y 29 (sin nombre especial), usamos un nombre genérico
    if (level >= 11 && level < 30 && !RANGO_NOMBRES[level]) {
        rangoNombre = `Avanzado ${level}`;
    } else if (level >= 31 && level < 50 && !RANGO_NOMBRES[level]) {
        rangoNombre = `Élite ${level}`;
    }

    // El resultado final es "rango-X" (para el CSS) y el nombre visible.
    const cssClass = `rango-${level}`;
    const nombreCompleto = `Rango ${level} - ${rangoNombre}`;
    
    return {
        nombre: nombreCompleto,
        cssClass: cssClass,
        nivel: level
    };
}

module.exports = {
    getRango
};