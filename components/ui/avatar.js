import React from "react"

export function Avatar({ className = "", ...props }) {
  return (
    <span
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full org-avatar ${className}`}
      {...props}
    />
  )
}

export function AvatarImage({ className = "", ...props }) {
  return (
    <img
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  )
}

export function AvatarFallback({ className = "", ...props }) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center rounded-full font-semibold uppercase tracking-wide text-white org-avatar-fallback ${className}`}
      {...props}
    />
  )
}