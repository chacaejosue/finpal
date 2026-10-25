import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recomendado para AES-GCM
const PREFIX = "enc:v1:";

function getMasterKey(): Buffer {
  const keyHex = process.env.APP_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "APP_ENCRYPTION_KEY no configurada o no tiene 64 caracteres hexadecimales (32 bytes)"
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Comprueba si un valor ya está cifrado con el prefijo enc:v1:
 */
export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/**
 * Cifra un texto usando AES-256-GCM.
 * Formato de salida: "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 * Si el texto es nulo/vacío o ya está cifrado, lo retorna sin modificar.
 */
export function encryptFieldSync(plainText: string | null | undefined): string | null {
  if (plainText == null || plainText === "") return null;
  const str = String(plainText).trim();
  if (str === "") return null;
  if (isEncrypted(str)) return str;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);

  let encrypted = cipher.update(str, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Descifra un texto en formato "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>".
 * Si no está cifrado (dato previo en texto plano), lo retorna tal cual (compatibilidad hacia atrás).
 */
export function decryptFieldSync(encryptedText: string | null | undefined): string | null {
  if (encryptedText == null || encryptedText === "") return null;
  const str = String(encryptedText);

  if (!isEncrypted(str)) return str;

  const parts = str.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return str;

  const [ivHex, tagHex, cipherHex] = parts;

  try {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Error descifrando campo protegido:", err);
    return "[DATO_PROTEGIDO]";
  }
}

/**
 * Versión asíncrona estándar de cifrado
 */
export async function encryptField(plainText: string | null | undefined): Promise<string | null> {
  return encryptFieldSync(plainText);
}

/**
 * Versión asíncrona estándar de descifrado
 */
export async function decryptField(encryptedText: string | null | undefined): Promise<string | null> {
  return decryptFieldSync(encryptedText);
}

/**
 * Auto-migra en segundo plano registros con campos en texto plano a formato cifrado AES-256-GCM.
 * Se ejecuta silenciosamente usando la sesión del usuario actual (respetando RLS).
 */
export function autoMigrateRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  rowId: string,
  fieldsToUpdate: Record<string, string | null | undefined>
): void {
  // Disparar en segundo plano sin bloquear el hilo principal ni la respuesta al usuario
  (async () => {
    try {
      const payload: Record<string, string | null> = {};
      for (const [key, val] of Object.entries(fieldsToUpdate)) {
        if (val !== undefined && val !== null && val !== "") {
          payload[key] = encryptFieldSync(val);
        }
      }
      if (Object.keys(payload).length > 0) {
        await supabase.from(table).update(payload).eq("id", rowId);
      }
    } catch {
      // Ignorar de forma segura en caso de desconexión o fallo temporal
    }
  })();
}

