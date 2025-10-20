import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">SEED SHIN Dashboard</h1>
          <p className="text-slate-600">Create your account to get started</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border border-slate-200",
              headerTitle: "text-slate-800",
              headerSubtitle: "text-slate-600",
              socialButtonsBlockButton: "border-slate-300 hover:bg-slate-50",
              formButtonPrimary: "bg-[#1A2332] hover:bg-[#2A3342]",
              footerActionLink: "text-[#4A6FA5] hover:text-[#5B7C99]",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}
