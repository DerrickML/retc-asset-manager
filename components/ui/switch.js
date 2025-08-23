"use client"

import * as React from "react"

const Switch = React.forwardRef(({ className = "", checked, onCheckedChange, disabled, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false)
  
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked)
    }
  }, [checked])
  
  const handleChange = () => {
    if (disabled) return
    
    const newChecked = !isChecked
    setIsChecked(newChecked)
    onCheckedChange?.(newChecked)
  }
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      ref={ref}
      className={`peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 ${
        isChecked 
          ? "bg-blue-600" 
          : "bg-gray-200"
      } ${className}`}
      disabled={disabled}
      onClick={handleChange}
      {...props}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          isChecked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
})

Switch.displayName = "Switch"

export { Switch }