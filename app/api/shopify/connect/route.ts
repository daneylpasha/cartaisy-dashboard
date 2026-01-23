import { getServerSession, authConfig } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_SCOPES =
  "read_products,write_products,read_orders,read_customers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!SHOPIFY_API_KEY) {
      return NextResponse.json(
        { error: "Shopify API key not configured" },
        { status: 500 }
      );
    }

    const { shop } = await request.json();

    if (!shop) {
      return NextResponse.json(
        { error: "Shop name is required" },
        { status: 400 }
      );
    }

    // Normalize shop domain
    const shopDomain = shop.includes(".myshopify.com")
      ? shop
      : `${shop}.myshopify.com`;

    // Generate state for CSRF protection (includes storeId)
    const state = Buffer.from(
      JSON.stringify({
        storeId: session.user.storeId,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Build Shopify OAuth authorization URL
    // Must match Shopify Partner Dashboard redirect URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/v1/shopify/oauth/callback`;
    const authorizationUrl =
      `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_API_KEY}` +
      `&scope=${SHOPIFY_SCOPES}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`;

    return NextResponse.json({
      data: { authorizationUrl },
    });
  } catch (error) {
    console.error("Shopify connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
