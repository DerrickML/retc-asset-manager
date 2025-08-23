import React, { useState } from "react"

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child => 
        React.cloneElement(child, { open, setOpen })
      )}
    </div>
  )
}

export function DropdownMenuTrigger({ children, asChild, open, setOpen, ...props }) {
  const triggerProps = {
    onClick: () => setOpen(!open),
    ...props
  }

  if (asChild && React.Children.count(children) === 1) {
    return React.cloneElement(React.Children.only(children), triggerProps)
  }

  return <button {...triggerProps}>{children}</button>
}

export function DropdownMenuContent({ className = "", align = "start", children, open, setOpen, ...props }) {
  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-10" 
        onClick={() => setOpen(false)}
      />
      <div
        className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${
          align === "end" ? "right-0" : "left-0"
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

export function DropdownMenuItem({ className = "", asChild, children, onClick, ...props }) {
  const itemProps = {
    className: `relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`,
    onClick,
    ...props
  }

  if (asChild && React.Children.count(children) === 1) {
    return React.cloneElement(React.Children.only(children), itemProps)
  }

  return <div {...itemProps}>{children}</div>
}

export function DropdownMenuSeparator({ className = "", ...props }) {
  return (
    <div
      className={`-mx-1 my-1 h-px bg-muted ${className}`}
      {...props}
    />
  )
}