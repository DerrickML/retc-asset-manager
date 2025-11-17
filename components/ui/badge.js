import React from "react"

const badgeVariants = {
  default: "badge-org-primary",
  secondary: "badge-org-accent",
  destructive: "bg-red-100 text-red-700 border border-red-200",
  outline: "badge-neutral border border-transparent",
  highlight: "badge-org-highlight",
}

export function Badge({ className = "", variant = "default", ...props }) {
  const variantClass = badgeVariants[variant] || badgeVariants.default
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClass} ${className}`.trim()}
      {...props}
    />
  )
}