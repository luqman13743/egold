"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-2xl tracking-tight gold-shimmer">
          Essence
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide uppercase">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="relative py-1 group">
              {item.label}
              <span className="absolute left-0 -bottom-0.5 h-[1.5px] w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/search" aria-label="Search" className="hidden sm:flex p-2 rounded-full hover:bg-sand transition-colors">
            <Search size={20} />
          </Link>
          <Link href="/account" aria-label="Account" className="hidden sm:flex p-2 rounded-full hover:bg-sand transition-colors">
            <User size={20} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="flex p-2 rounded-full hover:bg-sand transition-colors">
            <ShoppingBag size={20} />
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-full hover:bg-sand transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <nav
        className={`md:hidden overflow-hidden border-t border-ink/10 px-4 flex flex-col gap-1 transition-all duration-300 ease-out ${
          open ? "max-h-64 py-3 opacity-100" : "max-h-0 py-0 opacity-0"
        }`}
      >
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="py-2 text-base">
            {item.label}
          </Link>
        ))}
        <Link href="/search" onClick={() => setOpen(false)} className="py-2 text-base">Search</Link>
        <Link href="/account" onClick={() => setOpen(false)} className="py-2 text-base">Account</Link>
      </nav>
    </header>
  );
}
