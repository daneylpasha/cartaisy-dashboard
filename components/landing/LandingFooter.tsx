"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { offerPaths, offerPositioning, supportEmail } from "@/lib/marketing/offer";
import { CookieSettingsButton } from "@/components/cookies";

const linkClass =
  "inline-flex min-h-11 items-center text-sm text-[#a3a69f] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300";

export default function LandingFooter() {
  const footerLinks = {
    product: [
      { label: "Fit check", href: offerPaths.fit },
      { label: "Pricing", href: offerPaths.pricing },
      { label: "Product tour", href: offerPaths.demo },
      { label: "Features", href: offerPaths.features },
      { label: "Walkthrough", href: offerPaths.walkthrough },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Contact", href: offerPaths.contact },
      { label: "Sign in", href: offerPaths.login },
    ],
    resources: [
      { label: "Docs", href: offerPaths.docs },
      { label: "FAQ", href: offerPaths.docsFaq },
      { label: "Shopify", href: offerPaths.docsShopify },
    ],
    legal: [
      { label: "Privacy", href: offerPaths.privacy },
      { label: "Terms", href: offerPaths.terms },
      { label: "Cookies", href: "/cookies" },
    ],
  };

  return (
    <footer className="border-t border-[#2D302B] bg-[#111210]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-12 sm:px-6 lg:px-12">
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-6 gap-y-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2 space-y-6 md:col-span-4 lg:col-span-2">
            <Link href="/" className="inline-flex w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
              <Image src="/cartaisy-white-logo.png" width={130} height={31} alt="Cartaisy" />
            </Link>

            <p className="max-w-sm leading-relaxed text-[#c5c7c1]">
              {offerPositioning.eyebrow}. Shoppers pay on Shopify hosted checkout.
            </p>

            <a
              href={`mailto:${supportEmail}`}
              aria-label="Email"
              className="inline-flex h-11 w-11 items-center justify-center border border-[#2D302B] text-[#a3a69f] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            >
              <Mail className="h-5 w-5" aria-hidden />
            </a>
          </div>

          <FooterColumn title="Product" links={footerLinks.product} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Resources" links={footerLinks.resources} />
          <div>
            <h3 className="mb-2 font-semibold text-white">Legal</h3>
            <ul className="flex flex-col">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <CookieSettingsButton className="min-h-11 text-sm" />
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[#2D302B] pt-8">
          <p className="text-sm text-[#a3a69f]">© {new Date().getFullYear()} Cartaisy. All rights reserved.</p>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex min-h-11 items-center text-sm text-[#a3a69f] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            {supportEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className={linkClass}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
