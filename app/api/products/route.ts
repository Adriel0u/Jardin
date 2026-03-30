import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { addProduct, getProducts } from "@/lib/googleSheets";
import { ProductInput } from "@/lib/types";
import { authOptions } from "@/lib/auth";

function normalizeInput(input: Partial<ProductInput>): ProductInput {
  return {
    producto: (input.producto ?? "").trim(),
    costo: (input.costo ?? "-").trim() || "-",
    venta: (input.venta ?? "-").trim() || "-",
    tipo: (input.tipo ?? "General").trim() || "General",
    imagen: (input.imagen ?? "").trim(),
  };
}

function isValidInput(input: ProductInput): boolean {
  return input.producto.length > 0;
}

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo leer el inventario de Google Sheets." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ProductInput>;
    const payload = normalizeInput(body);

    if (!isValidInput(payload)) {
      return NextResponse.json(
        { error: "El nombre del producto es obligatorio." },
        { status: 400 },
      );
    }

    await addProduct(payload);
    return NextResponse.json({ message: "Producto agregado." }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo agregar el producto." },
      { status: 500 },
    );
  }
}
