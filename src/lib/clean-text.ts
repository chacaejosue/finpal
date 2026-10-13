/**
 * Utilidades para sanitizar codificación de texto y reparar Mojibake en español.
 * Corrige errores comunes de codificación cuando se exportan archivos CSV desde
 * Excel en Windows (Windows-1252 / ISO-8859-1 vs UTF-8).
 */

export function fixSpanishEncoding(str: unknown): string {
  if (str == null) return "";
  let s = String(str);

  // 1. Reparar Mojibake clásico de UTF-8 decodificado como Windows-1252 / Latin-1
  const mojibakeReplacements: [RegExp, string][] = [
    [/Ã¡/g, "á"],
    [/Ã©/g, "é"],
    [/Ã\xad/g, "í"],
    [/Ã­/g, "í"],
    [/Ã³/g, "ó"],
    [/Ãº/g, "ú"],
    [/Ã±/g, "ñ"],
    [/Ã/g, "Á"],
    [/Ã‰/g, "É"],
    [/Ã\x8d/g, "Í"],
    [/Ã“/g, "Ó"],
    [/Ãš/g, "Ú"],
    [/Ã‘/g, "Ñ"],
    [/Â¿/g, "¿"],
    [/Â¡/g, "¡"],
    [/Â°/g, "°"],
    [/â‚¬/g, "€"],
    [/Â/g, ""],
  ];

  for (const [regex, rep] of mojibakeReplacements) {
    s = s.replace(regex, rep);
  }

  // 2. Reparar caracteres dañados específicos como "@!" o símbolos de corrupción
  s = s.replace(/descripci[@!\?]+n/gi, "descripción");
  s = s.replace(/pr[@!\?]stamo/gi, "préstamo");
  s = s.replace(/inter[@!\?]s/gi, "interés");
  s = s.replace(/cr[@!\?]dito/gi, "crédito");
  s = s.replace(/c[@!\?]dula/gi, "cédula");
  s = s.replace(/tel[@!\?]fono/gi, "teléfono");
  s = s.replace(/direcci[@!\?]n/gi, "dirección");
  s = s.replace(/observaci[@!\?]n/gi, "observación");
  s = s.replace(/observaci[@!\?]nes/gi, "observaciones");
  s = s.replace(/transacci[@!\?]n/gi, "transacción");
  s = s.replace(/comisi[@!\?]n/gi, "comisión");
  s = s.replace(/retenci[@!\?]n/gi, "retención");
  s = s.replace(/devoluci[@!\?]n/gi, "devolución");
  s = s.replace(/operaci[@!\?]n/gi, "operación");
  s = s.replace(/cancelaci[@!\?]n/gi, "cancelación");
  s = s.replace(/amortizaci[@!\?]n/gi, "amortización");
  s = s.replace(/liquidaci[@!\?]n/gi, "liquidación");
  s = s.replace(/bonificaci[@!\?]n/gi, "bonificación");
  s = s.replace(/renovaci[@!\?]n/gi, "renovación");

  // Regla general para terminaciones -ción / -sión corrompidas
  s = s.replace(/([a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,})ci[@!]+n\b/gi, "$1ción");
  s = s.replace(/([a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,})si[@!]+n\b/gi, "$1sión");

  return s.trim();
}

/**
 * Decodifica un ArrayBuffer de texto detectando inteligentemente UTF-8 vs Windows-1252 / ISO-8859-1.
 */
export function decodeTextBuffer(buffer: ArrayBuffer): string {
  // Intentar UTF-8 con fatal=true para detectar si los bytes son válidos en UTF-8
  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    // Si falla, es casi seguro Windows-1252 (formato estándar de Excel en Windows en español)
    try {
      const winDecoder = new TextDecoder("windows-1252");
      return winDecoder.decode(buffer);
    } catch {
      const latinDecoder = new TextDecoder("iso-8859-1");
      return latinDecoder.decode(buffer);
    }
  }
}
