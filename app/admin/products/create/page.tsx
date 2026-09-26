import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product — Admin" };

export default function CreateProductPage() {
  return (
    <div>
      <h1 className="font-display text-2xl mb-6">New product</h1>
      <ProductForm mode="create" />
    </div>
  );
}
