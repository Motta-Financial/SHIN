"use client"

import { UserButton } from "@clerk/nextjs"

export function ClerkUserButton() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-10 h-10",
        },
      }}
    />
  )
}
