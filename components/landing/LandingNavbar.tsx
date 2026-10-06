"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { offerPaths } from "@/lib/marketing/offer";

const navLinks = [
  { href: offerPaths.fit, label: "Fit" },
  { href: offerPaths.pricing, label: "Pricing" },
  { href: offerPaths.demo, label: "Product tour" },
  { href: offerPaths.features, label: "Features" },
  { href: offerPaths.docs, label: "Docs" },
];

const linkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300";
const primaryClass =
  "inline-flex h-10 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b0b0d]/80 px-3 backdrop-blur-md sm:px-4">
          <Link
            href="/"
            className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            <Image src="/cartaisy-white-logo.png" width={120} height={29} alt="Cartaisy" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-1 lg:flex">
            <Link href="/login" className={linkClass}>
              Sign In
            </Link>
            <Link href={offerPaths.fit} className={primaryClass}>
              Check fit
            </Link>
          </div>

          <button
            ref={buttonRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open ? (
          <div
            id={menuId}
            ref={panelRef}
            className="mt-2 rounded-2xl border border-white/10 bg-[#0b0b0d]/95 p-3 backdrop-blur-md lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass} onClick={close}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link href="/login" className={`${linkClass} text-center`} onClick={close}>
                Sign In
              </Link>
              <Link href={offerPaths.fit} className={primaryClass} onClick={close}>
                Check fit
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
