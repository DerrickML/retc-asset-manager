import { NextResponse } from "next/server"
import { assetsService, settingsService } from "../../../../../lib/appwrite/server-provider.js"

export async function GET(request, { params }) {
  try {
    // Check if guest portal is enabled
    const settings = await settingsService.get()
    if (!settings?.guestPortal) {
      return NextResponse.json({ error: "Guest portal is disabled" }, { status: 403 })
    }

    // Get all public assets and find the specific one
    const publicAssets = await assetsService.getPublicAssets()
    const asset = publicAssets.documents.find((a) => a.$id === params.id)

    if (!asset) {
      return NextResponse.json({ error: "Asset not found or not public" }, { status: 404 })
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Failed to get public asset:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
