"use client"

import { DebriefForm } from "@/components/debrief-form"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SubmitDebriefPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Weekly Debrief Submission
          </h1>
          <p className="text-gray-600 text-lg">Submit your weekly work summary for the SEED program</p>
        </div>

        {/* Form */}
        <DebriefForm />

        {/* Help Text */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-800">
            If you have any questions about filling out this form, please contact your clinic director or email{" "}
            <a href="mailto:seed@suffolk.edu" className="underline font-medium">
              seed@suffolk.edu
            </a>
          </p>
        </Card>
      </div>
    </div>
  )
}
