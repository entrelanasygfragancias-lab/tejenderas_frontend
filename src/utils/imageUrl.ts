/**
 * Genera la URL completa para un recurso de almacenamiento del backend.
 * Maneja automáticamente las diferencias entre entornos local y producción.
 */
export const getStorageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;

    // Si ya es una URL completa (http, data, blob), la devolvemos tal cual
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }

    // Limpiamos el path de barras iniciales y el prefijo 'storage/' si lo tiene
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (cleanPath.startsWith('storage/')) {
        cleanPath = cleanPath.substring(8);
    }

    // Obtenemos la URL base del API
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
        // En producción, si la variable falta, intentamos usar la raíz relativa
        return `/storage/${cleanPath}`;
    }

    // Extraemos la base (quitamos /api y barras finales)
    const baseUrl = apiUrl.replace(/\/api$/, '').replace(/\/$/, '');

    return `${baseUrl}/storage/${cleanPath}`;
};
