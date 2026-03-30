import { google, sheets_v4 } from "googleapis";
import { initialProducts } from "@/lib/initialProducts";
import { Product, ProductInput } from "@/lib/types";

const HEADER_ROW = ["Producto", "Costo", "Venta", "Tipo", "Imagen"];
const DEFAULT_SHEET_NAME = "Inventario";
const DEFAULT_PLANT_TYPE = "General";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

function getFirstEnvVar(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  throw new Error(`Falta una variable de entorno requerida: ${names.join(" o ")}`);
}

function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  const unquoted =
    trimmed.startsWith("\"") && trimmed.endsWith("\"")
      ? trimmed.slice(1, -1)
      : trimmed;
  const cleaned = unquoted.replace(/\\n/g, "\n").trim();

  if (
    !cleaned.includes("BEGIN PRIVATE KEY") ||
    !cleaned.includes("END PRIVATE KEY")
  ) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY no tiene un formato valido. Debe incluir BEGIN/END PRIVATE KEY.",
    );
  }

  return cleaned;
}

function getSheetsClient(): sheets_v4.Sheets {
  const clientEmail = getFirstEnvVar([
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  ]);
  const privateKey = normalizePrivateKey(getEnvVar("GOOGLE_PRIVATE_KEY"));

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function getSpreadsheetConfig() {
  return {
    spreadsheetId: getEnvVar("GOOGLE_SHEET_ID"),
    sheetName: process.env.GOOGLE_SHEET_NAME || DEFAULT_SHEET_NAME,
  };
}

async function ensureHeaderRow(client: sheets_v4.Sheets): Promise<void> {
  const { spreadsheetId, sheetName } = getSpreadsheetConfig();
  const headerRange = `${sheetName}!A1:E1`;
  const headerResponse = await client.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });

  const currentHeader = headerResponse.data.values?.[0] ?? [];
  const missingHeader = HEADER_ROW.some((title, index) => currentHeader[index] !== title);

  if (!missingHeader) return;

  await client.spreadsheets.values.update({
    spreadsheetId,
    range: headerRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [HEADER_ROW],
    },
  });
}

async function seedInitialProducts(client: sheets_v4.Sheets): Promise<void> {
  const { spreadsheetId, sheetName } = getSpreadsheetConfig();

  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A2:E`,
    valueInputOption: "RAW",
    requestBody: {
      values: initialProducts.map((item) => [
        item.producto,
        item.costo,
        item.venta,
        item.tipo ?? DEFAULT_PLANT_TYPE,
        item.imagen ?? "",
      ]),
    },
  });
}

function toProduct(row: string[], index: number): Product {
  return {
    id: index + 2,
    producto: row[0] ?? "",
    costo: row[1] ?? "-",
    venta: row[2] ?? "-",
    tipo: row[3] ?? DEFAULT_PLANT_TYPE,
    imagen: row[4] ?? "",
  };
}

export async function getProducts(): Promise<Product[]> {
  const client = getSheetsClient();
  const { spreadsheetId, sheetName } = getSpreadsheetConfig();
  const range = `${sheetName}!A2:E`;

  await ensureHeaderRow(client);

  let response = await client.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  if (!response.data.values || response.data.values.length === 0) {
    await seedInitialProducts(client);
    response = await client.spreadsheets.values.get({ spreadsheetId, range });
  }

  return (response.data.values ?? []).map((row, index) => toProduct(row, index));
}

export async function addProduct(payload: ProductInput): Promise<void> {
  const client = getSheetsClient();
  const { spreadsheetId, sheetName } = getSpreadsheetConfig();

  await client.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:E`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          payload.producto,
          payload.costo,
          payload.venta,
          payload.tipo ?? DEFAULT_PLANT_TYPE,
          payload.imagen ?? "",
        ],
      ],
    },
  });
}

export async function updateProduct(id: number, payload: ProductInput): Promise<void> {
  const client = getSheetsClient();
  const { spreadsheetId, sheetName } = getSpreadsheetConfig();

  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${id}:E${id}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          payload.producto,
          payload.costo,
          payload.venta,
          payload.tipo ?? DEFAULT_PLANT_TYPE,
          payload.imagen ?? "",
        ],
      ],
    },
  });
}

export async function deleteProduct(id: number): Promise<void> {
  const client = getSheetsClient();
  const { spreadsheetId, sheetName } = getSpreadsheetConfig();

  const spreadsheet = await client.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets?.find(
    (item) => item.properties?.title === sheetName,
  );
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new Error(`No se encontró la hoja ${sheetName}`);
  }

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: id - 1,
              endIndex: id,
            },
          },
        },
      ],
    },
  });
}
