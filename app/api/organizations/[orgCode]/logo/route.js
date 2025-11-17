import { APPWRITE_CONFIG } from "../../../../../lib/appwrite/config";
import { ORG_THEMES } from "../../../../../lib/constants/org-branding";

export const runtime = "nodejs";

const API_KEY = process.env.APPWRITE_API_KEY;

function resolveOrgAssets(orgCode) {
  const org = ORG_THEMES[orgCode?.toUpperCase?.()];
  if (!org) return null;
  const { branding } = org;
  if (!branding) return null;
  return {
    bucketId: branding.bucketId,
    fileId: branding.fileId,
    fallbackUrl: branding.logo,
  };
}

export async function GET(request, context) {
  const params = await context.params;
  const assets = resolveOrgAssets(params?.orgCode);
  if (!assets) {
    return new Response(JSON.stringify({ error: "Logo not configured" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!API_KEY) {
    if (assets.fallbackUrl) {
      return Response.redirect(assets.fallbackUrl, 302);
    }
    return new Response(JSON.stringify({ error: "Missing Appwrite API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${assets.bucketId}/files/${assets.fileId}/view?project=${APPWRITE_CONFIG.projectId}`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Appwrite-Key": API_KEY,
        "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
        "X-Appwrite-Mode": "admin",
      },
    });

    if (!response.ok) {
      if (assets.fallbackUrl) {
        return Response.redirect(assets.fallbackUrl, 302);
      }
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Failed to load logo", details: errorText }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Unexpected error fetching logo", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

