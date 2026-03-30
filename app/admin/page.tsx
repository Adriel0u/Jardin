import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import ProductsInventory from "@/components/ProductsInventory";
import { authOptions } from "@/lib/auth";
import { getProducts } from "@/lib/googleSheets";
import { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  let products: Product[] = [];

  try {
    products = await getProducts();
  } catch (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-[#fffaf7]">
      <ProductsInventory initialProducts={products} adminMode />
    </main>
  );
}
