import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type Params = { params: { asset: string } };

const BRAND_ASSETS: Record<string, string[]> = {
  logo: [
    process.env.BRAND_LOGO_PATH || "",
    "C:/Users/Adriel/.cursor/projects/c-Users-Adriel-Documents-Progra-Jardin-Esperanza231/assets/c__Users_Adriel_AppData_Roaming_Cursor_User_workspaceStorage_632f03b811f2f1d902855ae1533efbec_images_image-ddfc6c37-b85f-423b-a125-2a5a36be331a.png",
  ],
  historia: [
    process.env.BRAND_HISTORIA_PATH || "",
    "C:/Users/Adriel/.cursor/projects/c-Users-Adriel-Documents-Progra-Jardin-Esperanza231/assets/c__Users_Adriel_AppData_Roaming_Cursor_User_workspaceStorage_632f03b811f2f1d902855ae1533efbec_images_image-4fb8bcc8-7c31-48b2-922d-31da401f684b.png",
  ],
};

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  return "application/octet-stream";
}

export async function GET(_: Request, { params }: Params) {
  const assetKey = params.asset.toLowerCase();
  const candidates = BRAND_ASSETS[assetKey];

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ error: "Asset no encontrado." }, { status: 404 });
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const buffer = await fs.readFile(candidate);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": getContentType(candidate),
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      // Try the next candidate path if this file is not available.
    }
  }

  return NextResponse.json(
    { error: "No se pudo cargar el asset visual." },
    { status: 404 },
  );
}
