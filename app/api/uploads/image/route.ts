import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        {
          error:
            "Configura CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET para subir imagenes.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo de imagen no valido." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten archivos de imagen." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen supera el limite de 5MB." },
        { status: 400 },
      );
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", "jardin-esperanza/products");

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      },
    );

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error(uploadError);
      return NextResponse.json(
        { error: "No se pudo subir la imagen al almacenamiento." },
        { status: 502 },
      );
    }

    const uploaded = (await uploadResponse.json()) as { secure_url?: string };
    if (!uploaded.secure_url) {
      return NextResponse.json(
        { error: "No se obtuvo URL de la imagen subida." },
        { status: 502 },
      );
    }

    return NextResponse.json({ imageUrl: uploaded.secure_url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error inesperado al subir imagen." },
      { status: 500 },
    );
  }
}
