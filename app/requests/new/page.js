"use client"

import { MainLayout } from "../../../components/layout/main-layout"
import { RequestForm } from "../../../components/requests/request-form"

export default function NewRequestPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Asset Request</h1>
          <p className="text-gray-600">Request assets for your project or work needs</p>
        </div>

        <RequestForm />
      </div>
    </MainLayout>
  )
}
