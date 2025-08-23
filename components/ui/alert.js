import React from "react"

const alertVariants = {
  default: "bg-white text-gray-900",
  destructive: "border-red-500/50 text-red-700 bg-red-50 [&>svg]:text-red-600"
}

export function Alert({ className = "", variant = "default", ...props }) {
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-600 ${alertVariants[variant]} ${className}`}
      {...props}
    />
  )
}

export function AlertTitle({ className = "", ...props }) {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    />
  )
}

export function AlertDescription({ className = "", ...props }) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props} />
  )
}