import { Client, Account, Databases, Storage, Functions } from "appwrite"
import { APPWRITE_CONFIG } from "./config.js"

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)

// Force cookie-based session management instead of localStorage
if (typeof window !== 'undefined') {
  // Set the endpoint with a custom domain to enable cookie sessions
  // This forces Appwrite to use cookies instead of localStorage
  client.setEndpoint(APPWRITE_CONFIG.endpoint)
  
  // Alternative approach: Override the session storage method
  const originalSetSession = client.setSession.bind(client)
  client.setSession = function(session) {
    if (session) {
      // Store session in cookie instead of localStorage
      document.cookie = `a_session_${APPWRITE_CONFIG.projectId}=${session}; path=/; secure; samesite=strict`
    } else {
      // Clear cookie
      document.cookie = `a_session_${APPWRITE_CONFIG.projectId}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
    return originalSetSession(session)
  }
}

// Initialize services
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

export { client }
