import ProductsInventory from "@/components/ProductsInventory";
import { getProducts } from "@/lib/googleSheets";
import { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let products: Product[] = [];

  try {
    products = await getProducts();
  } catch (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-[#fffaf7]">
      <ProductsInventory initialProducts={products} adminMode={false} />
    </main>
  );
}
