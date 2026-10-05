/**
 * Utilidad de compresión y optimización de imágenes locales
 * Convierte archivos de imagen subidos localmente a DataURL optimizados
 * garantizando que nunca superen 140.000 caracteres (unos 105 KB)
 * para cumplir estrictamente con las reglas de seguridad de Firestore (máx. 150.000).
 */

export const MAX_IMAGE_CHARS = 140000;

export function validateImageSize(
  base64OrUrl: string,
  maxChars = MAX_IMAGE_CHARS
): { isValid: boolean; error?: string } {
  if (!base64OrUrl || typeof base64OrUrl !== 'string') {
    return { isValid: true };
  }
  // Si es una URL externa corta, es válida
  if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
    if (base64OrUrl.length > 2000) {
      return { isValid: false, error: 'La URL de la imagen excede el límite permitido de 2.000 caracteres.' };
    }
    return { isValid: true };
  }

  if (base64OrUrl.length > maxChars) {
    const kb = Math.round(base64OrUrl.length / 1024);
    const maxKb = Math.round(maxChars / 1024);
    return {
      isValid: false,
      error: `La imagen comprimida (${kb} KB) supera el límite de seguridad permitido (${maxKb} KB). Por favor utiliza una imagen más liviana.`
    };
  }

  return { isValid: true };
}

export async function compressImageFile(
  file: File,
  initialMaxWidth = 640,
  initialMaxHeight = 640,
  initialQuality = 0.8
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.');
  }

  // Cargar imagen en elemento Image
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo local.'));
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error('Error al decodificar la imagen.'));
    image.onload = () => resolve(image);
    image.src = dataUrl;
  });

  // Intentos de compresión progresiva decreciente
  const attempts = [
    { maxWidth: initialMaxWidth, maxHeight: initialMaxHeight, quality: initialQuality },
    { maxWidth: 560, maxHeight: 560, quality: 0.75 },
    { maxWidth: 480, maxHeight: 480, quality: 0.7 },
    { maxWidth: 400, maxHeight: 400, quality: 0.65 },
    { maxWidth: 360, maxHeight: 360, quality: 0.55 },
    { maxWidth: 300, maxHeight: 300, quality: 0.45 }
  ];

  for (const attempt of attempts) {
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > attempt.maxWidth) {
        height = Math.round((height * attempt.maxWidth) / width);
        width = attempt.maxWidth;
      }
    } else {
      if (height > attempt.maxHeight) {
        width = Math.round((width * attempt.maxHeight) / height);
        height = attempt.maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    try {
      const output = canvas.toDataURL('image/jpeg', attempt.quality);
      if (output.length <= MAX_IMAGE_CHARS) {
        return output;
      }
    } catch {
      // Continuar al siguiente intento
    }
  }

  throw new Error(
    `La imagen es demasiado pesada y no se pudo comprimir por debajo del límite de seguridad (${Math.round(MAX_IMAGE_CHARS / 1024)} KB). Por favor selecciona una imagen de menor tamaño o resolución.`
  );
}
