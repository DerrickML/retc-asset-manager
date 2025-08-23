import { NextResponse } from "next/server"
import { settingsService } from "../../../../lib/appwrite/server-provider.js"

export async function GET() {
  try {
    const settings = await settingsService.get()

    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 })
    }

    // Return only public branding information
    const brandData = {
      orgName: settings.branding.orgName,
      logoUrl: settings.branding.logoFileId ? `/api/files/${settings.branding.logoFileId}` : null,
      brandColor: settings.branding.brandColor,
      accentColor: settings.branding.accentColor,
    }

    return NextResponse.json(brandData)
  } catch (error) {
    console.error("Failed to get brand data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
