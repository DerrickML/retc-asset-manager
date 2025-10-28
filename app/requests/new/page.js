"use client";

import { RequestForm } from "../../../components/requests/request-form";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";

export default function NewRequestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Link href="/requests" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Requests
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                New Asset Request
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Request assets for your project or work needs
              </p>
            </div>
          </div>
        </div>

        <RequestForm />
      </div>
    </div>
  );
}
