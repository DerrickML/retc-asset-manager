import { NextResponse } from "next/server";

// Server-side route to get orgId at runtime (can read env vars)
// This works in production because server-side code can always read env vars
export async function GET(request) {
  try {
    // Get orgCode from query param or cookie
    const orgCodeParam = request.nextUrl.searchParams.get("orgCode");
    const cookie = request.cookies.get("currentOrgCode");
    const orgCode = (orgCodeParam || cookie?.value || "RETC").toUpperCase();

    // Read env vars at runtime (server-side can always access these)
    const retcOrgId = process.env.NEXT_PUBLIC_RETC_ORG_ID || "";
    const nrepOrgId = process.env.NEXT_PUBLIC_NREP_ORG_ID || "";

    let orgId = "";
    if (orgCode === "NREP" && nrepOrgId) {
      orgId = nrepOrgId.trim();
    } else if (orgCode === "RETC" && retcOrgId) {
      orgId = retcOrgId.trim();
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID not found for orgCode: " + orgCode },
        { status: 404 }
      );
    }

    return NextResponse.json({ orgId, orgCode });
  } catch (error) {
    console.error("Error getting orgId:", error);
    return NextResponse.json(
      { error: "Failed to get organization ID" },
      { status: 500 }
    );
  }
}

