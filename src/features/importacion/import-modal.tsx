"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  FileText,
  FileUp,
} from "lucide-react";
import {
  importarContactos,
  importarPrestamos,
  importarMovimientos,
  type ImportResult,
} from "./actions";
import { fixSpanishEncoding, decodeTextBuffer } from "@/lib/clean-text";

type EntidadTipo = "prestamos" | "contactos" | "movimientos";

interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
  helper?: string;
}

const FIELDS_BY_ENTITY: Record<EntidadTipo, FieldDefinition[]> = {
  prestamos: [
    {
      key: "contacto_nombre",
      label: "Persona / Deudor",
      required: true,
      synonyms: [
        "contacto",
        "deudor",
        "nombre",
        "cliente",
        "persona",
        "titular",
        "prestatario",
        "beneficiario",
        "nombre cliente",
        "nombre deudor",
        "nombre del cliente",
        "prestado a",
        "quien recibe",
      ],
      helper: "Nombre de la persona o deudor que recibe el préstamo",
    },
    {
      key: "monto",
      label: "Monto / Capital",
      required: true,
      synonyms: [
        "monto",
        "capital",
        "prestado",
        "importe",
        "principal",
        "dinero",
        "valor",
        "cantidad",
        "total",
        "monto prestado",
        "capital entregado",
        "prestamo",
        "préstamo",
      ],
      helper: "Monto total entregado (ej: 5000 o Bs. 5.000)",
    },
    {
      key: "tasa_interes",
      label: "Tasa de interés mensual (%)",
      required: false,
      synonyms: [
        "interes",
        "interés",
        "tasa",
        "tasa interes",
        "tasa de interes",
        "interes mensual",
        "interés mensual",
        "tasa mensual",
        "porcentaje",
        "redito",
        "ganancia",
      ],
      helper: "Porcentaje mensual (ej: 3% o 3). Si está vacío o es 0, no cobrará interés",
    },
    {
      key: "fecha_inicio",
      label: "Fecha de inicio / entrega",
      required: true,
      synonyms: [
        "fecha",
        "inicio",
        "fecha inicio",
        "fecha entrega",
        "fecha prestamo",
        "fecha de inicio",
        "fecha desembolso",
        "desembolso",
        "entrega",
        "otorgado",
        "f inicio",
        "f entrega",
      ],
      helper: "Cualquier formato: DD/MM/AAAA, AAAA-MM-DD o formato fecha de Excel",
    },
    {
      key: "dia_pago",
      label: "Día de cobro mensual (1-31)",
      required: false,
      synonyms: [
        "dia pago",
        "día de pago",
        "dia de pago",
        "dia cobro",
        "día cobro",
        "vencimiento",
        "dia vencimiento",
        "cuota",
      ],
      helper: "Si no lo tienes en una columna, se tomará el día de la fecha de inicio",
    },
    {
      key: "nombre",
      label: "Concepto / Descripción del préstamo",
      required: false,
      synonyms: [
        "concepto",
        "motivo",
        "descripcion",
        "descripción",
        "detalle",
        "tipo",
        "glosa",
      ],
      helper: "Opcional. Si lo dejas vacío, se llamará 'Préstamo a [Nombre]'",
    },
    {
      key: "estado",
      label: "Estado del préstamo",
      required: false,
      synonyms: [
        "estado",
        "status",
        "situacion",
        "situación",
        "pagado",
        "cobrado",
        "saldado",
        "por cobrar",
        "pendiente",
      ],
      helper: "Valores: 'pagado', 'por cobrar', 'activo'. Si se omite queda como activo.",
    },
    {
      key: "notas",
      label: "Notas / Observaciones",
      required: false,
      synonyms: [
        "notas",
        "nota",
        "observacion",
        "observaciones",
        "comentario",
        "comentarios",
        "obs",
      ],
      helper: "Cualquier detalle adicional o comentario",
    },
  ],
  contactos: [
    {
      key: "nombre",
      label: "Nombre completo",
      required: true,
      synonyms: [
        "nombre",
        "contacto",
        "deudor",
        "cliente",
        "persona",
        "titular",
        "nombre y apellido",
        "nombres",
        "apellidos",
      ],
    },
    {
      key: "telefono",
      label: "Teléfono / Celular",
      required: false,
      synonyms: [
        "telefono",
        "teléfono",
        "celular",
        "whatsapp",
        "movil",
        "móvil",
        "fono",
        "telf",
        "numero",
      ],
    },
    {
      key: "email",
      label: "Correo electrónico",
      required: false,
      synonyms: ["email", "correo", "mail", "e-mail", "correo electronico"],
    },
    {
      key: "notas",
      label: "Notas",
      required: false,
      synonyms: ["notas", "nota", "observaciones", "comentario", "detalle"],
    },
  ],
  movimientos: [
    {
      key: "fecha",
      label: "Fecha del movimiento",
      required: true,
      synonyms: ["fecha", "dia", "día", "ocurrido", "f movimiento", "fecha gasto"],
    },
    {
      key: "monto",
      label: "Monto",
      required: true,
      synonyms: ["monto", "importe", "total", "cantidad", "dinero", "valor"],
    },
    {
      key: "descripcion",
      label: "Descripción / Concepto",
      required: false,
      synonyms: ["descripcion", "descripción", "concepto", "detalle", "motivo", "glosa"],
    },
    {
      key: "cuenta_nombre",
      label: "Cuenta de dinero (Caja, Banco, etc.)",
      required: true,
      synonyms: ["cuenta", "cuenta_nombre", "banco", "caja", "origen", "destino", "billetera"],
      helper: "Debe coincidir con alguna de tus cuentas",
    },
  ],
};

function normalizeHeader(h: unknown): string {
  if (h == null) return "";
  return String(h)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Limpiador flexible de números (soporta "Bs 1.500,50", "$5,000", "1200", 1500, etc.)
function cleanNumber(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;

  let str = String(val).replace(/[^\d.,-]/g, "").trim();
  if (!str) return 0;

  // Si tiene coma y punto, detectamos cuál es el separador de decimales
  if (str.includes(",") && str.includes(".")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      // Latino: 1.500,50 -> 1500.50
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Internacional: 1,500.50 -> 1500.50
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    // Solo coma: "1500,50" -> "1500.50"
    str = str.replace(",", ".");
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// Limpiador flexible de fechas (soporta números seriales de Excel, objetos Date y strings DD/MM/AAAA, YYYY-MM-DD, etc.)
function cleanDate(val: unknown): string {
  if (val == null) return new Date().toISOString().slice(0, 10);

  // Si ya es un objeto Date
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toISOString().slice(0, 10);
    }
  }

  // Si es un número serial de Excel (ej: 45200)
  if (typeof val === "number" && val > 20000 && val < 90000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().slice(0, 10);
    }
  }

  const v = String(val).trim();
  if (!v) return new Date().toISOString().slice(0, 10);

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // Formato DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  const dmy = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    let year = dmy[3];
    if (year.length === 2) {
      year = "20" + year;
    }
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(v);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

export function ImportModal({
  espacioId,
  isOpen,
  onClose,
  onSuccess,
  cuentasDisponibles = [],
}: {
  espacioId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cuentasDisponibles?: { id: string; nombre: string }[];
}) {
  const [entidad, setEntidad] = useState<EntidadTipo>("prestamos");
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  const [mapping, setMapping] = useState<Record<string, string>>({}); // fieldKey -> userColumnHeader
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ImportResult | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFields = FIELDS_BY_ENTITY[entidad];

  // Auto-mapeo inteligente con puntuación y sin colisiones
  const autoMapHeaders = useCallback((headers: string[], fields: FieldDefinition[]) => {
    const newMapping: Record<string, string> = {};
    const usedHeaders = new Set<string>();

    fields.forEach((field) => {
      const normFieldKey = normalizeHeader(field.key);

      // 1. Coincidencia exacta con la key o nombre de campo
      const exactMatch = headers.find(
        (h) => !usedHeaders.has(h) && normalizeHeader(h) === normFieldKey
      );
      if (exactMatch) {
        newMapping[field.key] = exactMatch;
        usedHeaders.add(exactMatch);
        return;
      }

      // 2. Coincidencia con sinónimos (priorizando coincidencia exacta de sinónimo)
      let bestMatch: string | null = null;
      let highestScore = 0;

      for (const rawHeader of headers) {
        if (usedHeaders.has(rawHeader)) continue;
        const normH = normalizeHeader(rawHeader);
        if (!normH) continue;

        for (const syn of field.synonyms) {
          const normSyn = normalizeHeader(syn);
          if (!normSyn) continue;

          // Coincidencia exacta del sinónimo
          if (normH === normSyn) {
            if (highestScore < 100) {
              highestScore = 100;
              bestMatch = rawHeader;
            }
          }
          // El encabezado empieza o contiene el sinónimo completo (mínimo 4 caracteres para evitar falsos positivos)
          else if (normSyn.length >= 4 && normH.includes(normSyn)) {
            if (highestScore < 75) {
              highestScore = 75;
              bestMatch = rawHeader;
            }
          }
          // El sinónimo contiene el encabezado completo (mínimo 4 caracteres)
          else if (normH.length >= 4 && normSyn.includes(normH)) {
            if (highestScore < 50) {
              highestScore = 50;
              bestMatch = rawHeader;
            }
          }
        }
      }

      if (bestMatch) {
        newMapping[field.key] = bestMatch;
        usedHeaders.add(bestMatch);
      }
    });

    setMapping(newMapping);
  }, []);

  // Procesa una hoja de Excel / CSV y detecta inteligentemente la fila de encabezados
  const processSheet = useCallback((sheet: XLSX.WorkSheet, currentFieldsDef: FieldDefinition[]) => {
    const rawMatrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (!rawMatrix || rawMatrix.length === 0) {
      setErrorGlobal("La hoja seleccionada está vacía.");
      return;
    }

    // Convertir todo a strings limpios
    const matrix: string[][] = rawMatrix.map((row) =>
      Array.isArray(row) ? row.map((cell) => (cell != null ? String(cell).trim() : "")) : []
    );

    // Detección inteligente de fila de encabezados:
    // En hojas reales, las filas 0 o 1 pueden ser títulos (ej. "Control Préstamos").
    // Buscamos en las primeras 6 filas la que tenga más coincidencias con términos conocidos y columnas no vacías.
    let bestHeaderRowIndex = 0;
    let maxKnownMatches = -1;

    const allSynonyms = new Set(
      Object.values(FIELDS_BY_ENTITY)
        .flat()
        .flatMap((f) => f.synonyms)
        .map(normalizeHeader)
    );

    const checkLimit = Math.min(6, matrix.length);
    for (let i = 0; i < checkLimit; i++) {
      const row = matrix[i];
      const filledCells = row.filter((c) => c.length > 0);
      if (filledCells.length < 2) continue; // Si solo tiene 1 celda, probablemente es un título de documento

      let matches = 0;
      filledCells.forEach((cell) => {
        const norm = normalizeHeader(cell);
        if (allSynonyms.has(norm)) matches += 2;
        else if (norm.length > 2) matches += 0.5;
      });

      if (matches > maxKnownMatches) {
        maxKnownMatches = matches;
        bestHeaderRowIndex = i;
      }
    }

    const rawHeaders = matrix[bestHeaderRowIndex] || [];
    // Filtrar columnas vacías al final
    let lastNonEmptyCol = rawHeaders.length - 1;
    while (lastNonEmptyCol >= 0 && (!rawHeaders[lastNonEmptyCol] || rawHeaders[lastNonEmptyCol] === "")) {
      lastNonEmptyCol--;
    }

    const headers: string[] = [];
    for (let c = 0; c <= lastNonEmptyCol; c++) {
      const h = rawHeaders[c] ? String(rawHeaders[c]).trim() : `Columna ${c + 1}`;
      headers.push(h);
    }

    if (headers.length === 0) {
      setErrorGlobal("No se pudieron detectar columnas en el archivo.");
      return;
    }

    // Filas de datos (posteriores al encabezado) que tengan al menos un valor
    const dataRows: string[][] = [];
    for (let r = bestHeaderRowIndex + 1; r < matrix.length; r++) {
      const row = matrix[r];
      const sliced = row.slice(0, headers.length);
      // Solo incluimos la fila si tiene al menos 1 celda con contenido
      if (sliced.some((val) => val && val.trim().length > 0)) {
        dataRows.push(sliced);
      }
    }

    if (dataRows.length === 0) {
      setErrorGlobal("No se encontraron filas con datos debajo de los encabezados.");
      return;
    }

    setFileHeaders(headers);
    setFileRows(dataRows);
    autoMapHeaders(headers, currentFieldsDef);
    setStep("mapping");
  }, [autoMapHeaders]);

  // Procesa el archivo (Excel .xlsx, .xls, .csv, .tsv, etc.) con SheetJS
  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setErrorGlobal(null);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const isCSV = /\.(csv|tsv|txt)$/i.test(file.name);
        let workbook: XLSX.WorkBook;

        if (isCSV) {
          // Decodificación inteligente: Detecta UTF-8 vs Windows-1252 / ISO-8859-1
          // y repara Mojibake o caracteres corrompidos tipo descripci@!n
          const decodedText = fixSpanishEncoding(decodeTextBuffer(buffer));
          workbook = XLSX.read(decodedText, {
            type: "string",
            cellDates: true,
            dateNF: "yyyy-mm-dd",
          });
        } else {
          workbook = XLSX.read(buffer, {
            type: "array",
            cellDates: true,
            dateNF: "yyyy-mm-dd",
          });
        }

        workbookRef.current = workbook;
        const sheetNames = workbook.SheetNames || [];

        if (sheetNames.length === 0) {
          setErrorGlobal("El libro no contiene hojas con información.");
          return;
        }

        setAvailableSheets(sheetNames);
        const firstSheetName = sheetNames[0];
        setSelectedSheet(firstSheetName);

        const sheet = workbook.Sheets[firstSheetName];
        processSheet(sheet, currentFields);
      } catch (err) {
        console.error("Error al procesar archivo:", err);
        setErrorGlobal(
          "No se pudo leer el archivo. Asegúrate de que sea un archivo de Excel (.xlsx, .xls) o CSV válido."
        );
      }
    };

    reader.onerror = () => {
      setErrorGlobal("Ocurrió un error al leer el archivo desde tu dispositivo.");
    };

    reader.readAsArrayBuffer(file);
  }, [currentFields, processSheet]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Cambio de hoja en un libro con múltiples pestañas
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbookRef.current && workbookRef.current.Sheets[sheetName]) {
      processSheet(workbookRef.current.Sheets[sheetName], currentFields);
    }
  };

  // Transformar filas a objetos listos para importar
  const transformedRows = useMemo(() => {
    if (fileRows.length === 0) return [];

    return fileRows.map((cols) => {
      const rowObj: Record<string, unknown> = {};

      currentFields.forEach((field) => {
        const userHeader = mapping[field.key];
        if (!userHeader) return;
        const colIndex = fileHeaders.indexOf(userHeader);
        if (colIndex === -1) return;
        const rawValue = cols[colIndex];

        if (field.key === "monto" || field.key === "tasa_interes") {
          rowObj[field.key] = cleanNumber(rawValue);
        } else if (field.key === "fecha_inicio" || field.key === "fecha") {
          rowObj[field.key] = cleanDate(rawValue);
        } else if (field.key === "dia_pago") {
          const d = parseInt(String(rawValue || "").replace(/[^\d]/g, ""), 10);
          rowObj[field.key] = d >= 1 && d <= 31 ? d : 15;
        } else {
          const strVal = rawValue != null ? String(rawValue).trim() : "";
          rowObj[field.key] = fixSpanishEncoding(strVal);
        }
      });

      // Lógica inteligente para préstamos
      if (entidad === "prestamos") {
        const contacto = fixSpanishEncoding(String(rowObj.contacto_nombre || "").trim());
        rowObj.contacto_nombre = contacto;
        if (!rowObj.nombre) {
          rowObj.nombre = contacto ? `Préstamo a ${contacto}` : "Préstamo";
        } else {
          rowObj.nombre = fixSpanishEncoding(String(rowObj.nombre));
        }
        if (rowObj.notas) {
          rowObj.notas = fixSpanishEncoding(String(rowObj.notas));
        }

        const tasa = Number(rowObj.tasa_interes || 0);
        rowObj.cobra_interes = tasa > 0;
        rowObj.tasa_interes = tasa;

        if (!rowObj.dia_pago && rowObj.fecha_inicio) {
          const diaFromFecha = parseInt(String(rowObj.fecha_inicio).slice(8, 10), 10);
          rowObj.dia_pago = diaFromFecha >= 1 && diaFromFecha <= 31 ? diaFromFecha : 15;
        }
        if (!rowObj.dia_pago) {
          rowObj.dia_pago = 15;
        }

        // Normalizar el campo estado desde el CSV
        const estadoRaw = String(rowObj.estado || "").toLowerCase().trim();
        if (estadoRaw.includes("pagado") || estadoRaw.includes("saldado") || estadoRaw.includes("cobrado") || estadoRaw === "si" || estadoRaw === "sí" || estadoRaw === "1") {
          rowObj.estado = "pagado";
        } else if (estadoRaw.includes("atras") || estadoRaw.includes("mora") || estadoRaw.includes("vencid")) {
          rowObj.estado = "atrasado";
        } else {
          rowObj.estado = "activo";
        }
      }

      if (entidad === "contactos") {
        if (rowObj.nombre) rowObj.nombre = fixSpanishEncoding(String(rowObj.nombre));
        if (rowObj.notas) rowObj.notas = fixSpanishEncoding(String(rowObj.notas));
      }

      if (entidad === "movimientos") {
        if (!rowObj.tipo) rowObj.tipo = "gasto";
        if (rowObj.descripcion) rowObj.descripcion = fixSpanishEncoding(String(rowObj.descripcion));
        if (rowObj.cuenta_nombre) rowObj.cuenta_nombre = fixSpanishEncoding(String(rowObj.cuenta_nombre));
      }

      return rowObj;
    });
  }, [fileRows, fileHeaders, mapping, currentFields, entidad]);

  // Filas válidas e incompletas para la vista previa
  const previewAnalysis = useMemo(() => {
    let validCount = 0;
    let invalidCount = 0;

    transformedRows.forEach((row) => {
      if (entidad === "prestamos") {
        const hasNombre = Boolean(row.contacto_nombre && String(row.contacto_nombre).trim().length > 0);
        const hasMonto = Boolean(Number(row.monto) > 0);
        if (hasNombre && hasMonto) validCount++;
        else invalidCount++;
      } else if (entidad === "contactos") {
        const hasNombre = Boolean(row.nombre && String(row.nombre).trim().length > 0);
        if (hasNombre) validCount++;
        else invalidCount++;
      } else {
        const hasMonto = Boolean(Number(row.monto) > 0);
        const hasCuenta = Boolean(row.cuenta_nombre && String(row.cuenta_nombre).trim().length > 0);
        if (hasMonto && hasCuenta) validCount++;
        else invalidCount++;
      }
    });

    return { validCount, invalidCount };
  }, [transformedRows, entidad]);

  async function handleImport() {
    if (transformedRows.length === 0) return;
    setLoading(true);
    setErrorGlobal(null);

    try {
      let res: ImportResult;
      if (entidad === "contactos") {
        res = await importarContactos(espacioId, transformedRows);
      } else if (entidad === "prestamos") {
        const cuentaDefecto = cuentasDisponibles[0]?.id || "";
        res = await importarPrestamos(espacioId, transformedRows, cuentaDefecto);
      } else {
        res = await importarMovimientos(espacioId, transformedRows);
      }

      setResultado(res);
      if (res.exitosos > 0) {
        onSuccess();
      }
    } catch (err) {
      setErrorGlobal(
        err instanceof Error ? err.message : "Error inesperado durante la importación"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-outline-variant/30 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">
                Importador Inteligente de FinPal
              </h3>
              <p className="text-xs text-on-surface-variant">
                Arrastra tu archivo Excel (.xlsx, .xls) o CSV tal como lo tienes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de módulo y pasos */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low/50 p-2.5 rounded-xl border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Módulo:</span>
            <div className="inline-flex rounded-lg bg-surface-container p-0.5">
              {(
                [
                  { id: "prestamos", label: "Préstamos" },
                  { id: "contactos", label: "Contactos" },
                  { id: "movimientos", label: "Movimientos" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setEntidad(tab.id);
                    setStep("upload");
                    setFileHeaders([]);
                    setFileRows([]);
                    setFileName("");
                    setResultado(null);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    entidad === tab.id
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span className={step === "upload" ? "text-primary font-bold" : ""}>1. Subir archivo</span>
            <span>→</span>
            <span className={step === "mapping" ? "text-primary font-bold" : ""}>2. Emparejar columnas</span>
            <span>→</span>
            <span className={step === "preview" ? "text-primary font-bold" : ""}>3. Vista previa</span>
          </div>
        </div>

        {/* ── PASO 1: SUBIR ARCHIVO CON DRAG & DROP REAL ── */}
        {step === "upload" && !resultado && (
          <div className="space-y-4 py-2">
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center relative ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.01] shadow-lg"
                  : "border-outline-variant/40 hover:border-primary/60 bg-surface-container-lowest/50 hover:bg-surface-container-low/40"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
                  isDragging ? "bg-primary text-on-primary scale-110" : "bg-primary/10 text-primary"
                }`}
              >
                {isDragging ? <FileUp className="w-7 h-7 animate-bounce" /> : <Upload className="w-7 h-7" />}
              </div>

              <span className="text-sm font-bold text-on-surface">
                {isDragging
                  ? "¡Suelta tu archivo aquí!"
                  : "Arrastra y suelta tu archivo Excel (.xlsx, .xls) o CSV"}
              </span>

              <p className="text-xs text-on-surface-variant mt-1.5 max-w-md">
                O haz clic aquí para buscarlo en tu dispositivo. Reconocemos automáticamente títulos, números con moneda y fechas.
              </p>

              <div className="flex items-center gap-3 mt-4 text-[11px] font-medium text-on-surface-variant/80">
                <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel (.xlsx, .xls)
                </span>
                <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Google Sheets / CSV
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

          </div>
        )}

        {/* ── PASO 2: EMPAREJAR COLUMNAS (MAPPING) ── */}
        {step === "mapping" && !resultado && (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-primary/10 text-primary p-3 rounded-xl border border-primary/20 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Mapeo inteligente activo:</strong> {fileName} ({fileRows.length} filas detectadas).
                </span>
              </div>

              {availableSheets.length > 1 && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-on-surface-variant font-medium">Hoja:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="px-2 py-1 rounded bg-surface border border-outline-variant/30 text-on-surface font-semibold text-xs"
                  >
                    {availableSheets.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[46vh]">
              {currentFields.map((field) => {
                const selectedCol = mapping[field.key] || "";
                const colIdx = fileHeaders.indexOf(selectedCol);
                const sampleValues =
                  colIdx !== -1
                    ? fileRows
                        .slice(0, 3)
                        .map((r) => r[colIdx])
                        .filter(Boolean)
                    : [];

                return (
                  <div
                    key={field.key}
                    className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      selectedCol
                        ? "border-primary/30 bg-primary/5"
                        : field.required
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-outline-variant/30 bg-surface-container-lowest"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface">{field.label}</span>
                        {field.required && (
                          <span className="text-[10px] text-primary font-bold px-1.5 py-0.2 rounded bg-primary/10">
                            Requerido
                          </span>
                        )}
                        {selectedCol && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Emparejado
                          </span>
                        )}
                      </div>
                      {field.helper && (
                        <p className="text-[11px] text-on-surface-variant">{field.helper}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-1">
                      <select
                        value={selectedCol}
                        onChange={(e) =>
                          setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="h-9 px-3 text-xs rounded-xl bg-surface-container text-on-surface border border-outline-variant/30 focus:border-primary outline-none min-w-[240px] font-medium"
                      >
                        <option value="">— (No incluir / Ninguna) —</option>
                        {fileHeaders.map((header) => (
                          <option key={header} value={header}>
                            Columna: {header}
                          </option>
                        ))}
                      </select>

                      {sampleValues.length > 0 && (
                        <span className="text-[11px] text-on-surface-variant/90 italic truncate max-w-[240px]">
                          Muestras: {sampleValues.map((s) => `"${s}"`).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PASO 3: VISTA PREVIA Y VALIDACIÓN ── */}
        {step === "preview" && !resultado && (
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-on-surface">
                {previewAnalysis.validCount} registros listos para importar
                {previewAnalysis.invalidCount > 0 && (
                  <span className="text-amber-600 font-semibold ml-2">
                    ({previewAnalysis.invalidCount} filas incompletas serán omitidas o ajustadas)
                  </span>
                )}
              </span>
              <span className="text-on-surface-variant text-[11px]">
                Monedas, puntos y fechas normalizados automáticamente
              </span>
            </div>

            <div className="flex-1 overflow-auto border border-outline-variant/20 rounded-xl bg-surface-container-lowest max-h-[46vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-surface-container text-on-surface-variant border-b border-outline-variant/30 z-10">
                  <tr>
                    <th className="p-2.5 font-semibold">#</th>
                    {currentFields
                      .filter((f) => mapping[f.key])
                      .map((f) => (
                        <th key={f.key} className="p-2.5 font-semibold">
                          {f.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {transformedRows.slice(0, 15).map((row, idx) => {
                    const isMissingRequired =
                      entidad === "prestamos"
                        ? !row.contacto_nombre || Number(row.monto) <= 0
                        : entidad === "contactos"
                        ? !row.nombre
                        : Number(row.monto) <= 0 || !row.cuenta_nombre;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-surface-container-low/50 ${
                          isMissingRequired ? "bg-amber-500/5 text-amber-900" : ""
                        }`}
                      >
                        <td className="p-2.5 font-mono text-on-surface-variant">
                          {idx + 1}
                          {isMissingRequired && (
                            <span className="ml-1 text-[10px] text-amber-600 font-bold" title="Falta dato requerido">
                              *
                            </span>
                          )}
                        </td>
                        {currentFields
                          .filter((f) => mapping[f.key])
                          .map((f) => {
                            const val = row[f.key];
                            return (
                              <td key={f.key} className="p-2.5 truncate max-w-[150px]">
                                {val !== undefined && val !== null && String(val).trim() !== ""
                                  ? String(val)
                                  : "—"}
                              </td>
                            );
                          })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {transformedRows.length > 15 && (
              <p className="text-[11px] text-on-surface-variant text-center">
                Mostrando las primeras 15 filas de un total de {transformedRows.length}.
              </p>
            )}
          </div>
        )}

        {/* ── RESULTADO DE IMPORTACIÓN ── */}
        {resultado && (
          <div className="space-y-4 py-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {resultado.exitosos > 0
                    ? `¡Importación exitosa!`
                    : "No se pudieron procesar las filas."}
                </p>
                <p className="text-xs mt-0.5 text-on-surface">
                  Se importaron <strong>{resultado.exitosos}</strong> registros directamente a tu espacio de trabajo.
                </p>
              </div>
            </div>

            {resultado.fallidos > 0 && (
              <div className="space-y-1.5 text-xs text-rose-600 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 max-h-48 overflow-y-auto">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {resultado.fallidos} fila(s) presentaron detalles o no pudieron procesarse:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] mt-1 text-on-surface">
                  {resultado.errores.slice(0, 10).map((e, idx) => (
                    <li key={idx}>
                      <strong>Fila {e.fila}:</strong> {e.mensaje}
                    </li>
                  ))}
                  {resultado.errores.length > 10 && (
                    <li className="font-semibold text-on-surface-variant">
                      ...y {resultado.errores.length - 10} filas más.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {errorGlobal && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
          <div>
            {step === "mapping" && !resultado && (
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-on-surface hover:bg-surface-container inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cambiar archivo
              </button>
            )}
            {step === "preview" && !resultado && (
              <button
                type="button"
                onClick={() => setStep("mapping")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-on-surface hover:bg-surface-container inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Ajustar emparejamiento
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              {resultado ? "Cerrar" : "Cancelar"}
            </button>

            {step === "mapping" && !resultado && (
              <button
                type="button"
                onClick={() => {
                  const missingRequired = currentFields
                    .filter((f) => f.required && !mapping[f.key])
                    .map((f) => f.label);

                  if (missingRequired.length > 0) {
                    setErrorGlobal(
                      `Debes emparejar los campos obligatorios: ${missingRequired.join(", ")}`
                    );
                    return;
                  }
                  setErrorGlobal(null);
                  setStep("preview");
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-on-primary hover:bg-primary/90 inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Ver vista previa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === "preview" && !resultado && (
              <button
                type="button"
                disabled={transformedRows.length === 0 || loading}
                onClick={handleImport}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirmar e importar ({transformedRows.length} registros)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
