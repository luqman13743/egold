import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, products } from "@/db";
import { publicUrlFor } from "@/lib/r2/upload";
import { ProductForm } from "@/components/admin/product-form";
import { ProductDangerZone } from "@/components/admin/product-danger-zone";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit product — Admin" };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: {
        orderBy: (img, { asc }) => [asc(img.position)],
      },
    },
  });

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Edit product</h1>

      <ProductForm
        mode="edit"
        initial={{
          ...product,
          images: product.images.map((img) => ({
            id: img.id,
            objectKey: img.objectKey,
            publicUrl: publicUrlFor(img.objectKey),
            altText: img.altText,
            position: img.position,
          })),
        }}
      />

      <ProductDangerZone
        productId={product.id}
        status={product.status}
      />
    </div>
  );
}
