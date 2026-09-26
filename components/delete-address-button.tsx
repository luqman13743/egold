"use client";

import { useTransition } from "react";
import { deleteAddress } from "@/actions/addresses";

export function DeleteAddressButton({ addressId }: { addressId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Remove this address?")) startTransition(() => deleteAddress(addressId));
      }}
      className="text-xs text-ink/50 hover:text-rust shrink-0"
    >
      Remove
    </button>
  );
}
