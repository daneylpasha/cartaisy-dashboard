"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { offerPaths } from "@/lib/marketing/offer";
import { inkPrimaryMotionClass } from "@/lib/marketing/publicInk";

const navLinks = [
  { href: offerPaths.fit, label: "Fit" },
  { href: offerPaths.pricing, label: "Pricing" },
  { href: offerPaths.demo, label: "Product tour" },
  { href: offerPaths.features, label: "Features" },
  { href: offerPaths.docs, label: "Docs" },
];

const shell = "mx-auto flex w-full max-w-[1280px] items-center px-5 sm:px-6 lg:px-12";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210]";

function isCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export default function LandingNavbar() {
  const pathname = usePathname();
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#2D302B] bg-[#111210]">
      <div className={`${shell} h-[68px] justify-between gap-3 lg:h-20`}>
        <Link href="/" className={`shrink-0 rounded-sm ${focusRing}`}>
          <Image src="/cartaisy-white-logo.png" width={120} height={29} alt="Cartaisy" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} pathname={pathname}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/login" className={`text-sm font-medium text-[#a3a69f] hover:text-white ${focusRing} rounded-sm px-1 py-2`}>
            Sign In
          </Link>
          <Link
            href={offerPaths.fit}
            className={`inline-flex h-12 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 ${focusRing} ${inkPrimaryMotionClass}`}
          >
            Check fit
          </Link>
        </div>

        <button
          ref={buttonRef}
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center text-white lg:hidden ${focusRing}`}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div id={menuId} ref={panelRef} className="border-t border-[#2D302B] bg-[#111210] lg:hidden">
          <div className="mx-auto w-full max-w-[1280px] px-5 py-2 sm:px-6">
            <nav aria-label="Mobile" className="flex flex-col">
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} pathname={pathname} onClick={close} mobile>
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-2 flex flex-col gap-2 border-t border-[#2D302B] py-3">
              <Link
                href="/login"
                className={`inline-flex min-h-11 items-center px-3 text-sm font-medium text-[#a3a69f] hover:text-white ${focusRing}`}
                onClick={close}
              >
                Sign In
              </Link>
              <Link
                href={offerPaths.fit}
                className={`inline-flex h-12 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 ${focusRing} ${inkPrimaryMotionClass}`}
                onClick={close}
              >
                Check fit
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  pathname,
  onClick,
  mobile = false,
  children,
}: {
  href: string;
  pathname: string;
  onClick?: () => void;
  mobile?: boolean;
  children: string;
}) {
  const current = isCurrent(pathname, href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className={
        mobile
          ? `relative inline-flex min-h-11 items-center px-3 text-sm font-medium ${current ? "text-white" : "text-[#d7d8d3] hover:text-white"} ${focusRing}`
          : `relative inline-flex h-11 items-center px-3 text-sm font-medium ${current ? "text-white" : "text-[#d7d8d3] hover:text-white"} ${focusRing}`
      }
    >
      {children}
      {current ? <span className="absolute inset-x-3 bottom-1.5 h-px bg-[#B6C4A1]" aria-hidden /> : null}
    </Link>
  );
}
