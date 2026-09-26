import { notFound } from "next/navigation";
import Image from "next/image";
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
    with: { images: { orderBy: (img, { asc }) => [asc(img.position)] } },
  });
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Edit product</h1>

      {product.images.length > 0 && (
        <div className="flex gap-3 mb-8 flex-wrap">
          {product.images.map((img) => (
            <div key={img.id} className="relative h-24 w-24 rounded overflow-hidden bg-sand dark:bg-white/5">
              <Image src={publicUrlFor(img.objectKey)} alt={img.altText ?? product.name} fill sizes="96px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <ProductForm mode="edit" initial={product} />

      <ProductDangerZone productId={product.id} status={product.status} />
    </div>
  );
}
