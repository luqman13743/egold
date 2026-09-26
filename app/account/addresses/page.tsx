import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/rbac";
import { getUserAddresses } from "@/services/account";
import { AddressForm } from "@/components/address-form";
import { DeleteAddressButton } from "@/components/delete-address-button";

export const metadata = { title: "Your addresses" };

export default async function AddressesPage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login?redirect=/account/addresses");

  const list = await getUserAddresses(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Your addresses</h1>

      {list.length > 0 && (
        <ul className="space-y-4 mb-10">
          {list.map((addr) => (
            <li key={addr.id} className="rounded-md border border-sand dark:border-white/10 p-4 text-sm flex justify-between gap-4">
              <div>
                <p className="font-medium">{addr.fullName} {addr.isDefault && <span className="text-xs text-accent">(default)</span>}</p>
                <p className="text-ink/70 dark:text-white/70">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                <p className="text-ink/70 dark:text-white/70">{addr.city}{addr.province ? `, ${addr.province}` : ""} {addr.postalCode}</p>
                <p className="text-ink/50 dark:text-white/50">{addr.phone}</p>
              </div>
              <DeleteAddressButton addressId={addr.id} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-display text-xl mb-4">Add a new address</h2>
      <AddressForm />
    </div>
  );
}
