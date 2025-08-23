import { NextResponse } from "next/server"
import { assetsService, settingsService } from "../../../../lib/appwrite/server-provider.js"
import { Query } from "appwrite"

export async function GET(request) {
  try {
    // Check if guest portal is enabled
    const settings = await settingsService.get()
    if (!settings?.guestPortal) {
      return NextResponse.json({ error: "Guest portal is disabled" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const location = searchParams.get("location")
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 12

    const queries = []

    // Add search query
    if (search) {
      queries.push(Query.search("name", search))
    }

    // Add filters
    if (category) {
      queries.push(Query.equal("category", category))
    }
    if (status) {
      queries.push(Query.equal("availableStatus", status))
    }
    if (location) {
      queries.push(Query.equal("publicLocationLabel", location))
    }

    // Add pagination
    queries.push(Query.limit(limit))
    queries.push(Query.offset((page - 1) * limit))
    queries.push(Query.orderDesc("$createdAt"))

    const result = await assetsService.getPublicAssets(queries)

    return NextResponse.json({
      data: result.documents,
      page,
      pageSize: limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    })
  } catch (error) {
    console.error("Failed to get public assets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
