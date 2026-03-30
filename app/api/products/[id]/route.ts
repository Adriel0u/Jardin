import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { deleteProduct, updateProduct } from "@/lib/googleSheets";
import { ProductInput } from "@/lib/types";
import { authOptions } from "@/lib/auth";

type Params = { params: { id: string } };

function normalizeInput(input: Partial<ProductInput>): ProductInput {
  return {
    producto: (input.producto ?? "").trim(),
    costo: (input.costo ?? "-").trim() || "-",
    venta: (input.venta ?? "-").trim() || "-",
    tipo: (input.tipo ?? "General").trim() || "General",
    imagen: (input.imagen ?? "").trim(),
  };
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 2) return null;
  return id;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = params;
    const id = parseId(rawId);

    if (id === null) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = (await request.json()) as Partial<ProductInput>;
    const payload = normalizeInput(body);

    if (!payload.producto) {
      return NextResponse.json(
        { error: "El nombre del producto es obligatorio." },
        { status: 400 },
      );
    }

    await updateProduct(id, payload);
    return NextResponse.json({ message: "Producto actualizado." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo actualizar el producto." },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = params;
    const id = parseId(rawId);

    if (id === null) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    await deleteProduct(id);
    return NextResponse.json({ message: "Producto eliminado." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo eliminar el producto." },
      { status: 500 },
    );
  }
}
