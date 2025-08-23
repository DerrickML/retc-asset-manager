"use client"

import * as React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"

const TooltipContext = createContext({})

export function TooltipProvider({ children, ...props }) {
  return (
    <div {...props}>
      {children}
    </div>
  )
}

export function Tooltip({ children, ...props }) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef(null)
  
  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, position, setPosition, triggerRef }}>
      <div className="relative">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children, asChild, ...props }) {
  const { setIsOpen, setPosition, triggerRef } = useContext(TooltipContext)
  
  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: rect.right + 8,
      y: rect.top + rect.height / 2
    })
    setIsOpen(true)
  }
  
  const handleMouseLeave = () => {
    setIsOpen(false)
  }
  
  if (asChild) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      ...props
    })
  }
  
  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}

export function TooltipContent({ children, side = "top", className = "", ...props }) {
  const { isOpen, position } = useContext(TooltipContext)
  
  if (!isOpen) return null
  
  const sideClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2", 
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  }
  
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: side === "right" ? position.x : position.x - 100,
        top: position.y - 20,
      }}
    >
      <div
        className={`px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-700 max-w-xs ${className}`}
        {...props}
      >
        {children}
        {/* Tooltip arrow */}
        <div 
          className="absolute w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"
          style={{
            left: side === "right" ? "-4px" : "auto",
            top: "50%",
            transform: side === "right" ? "translateY(-50%) rotate(45deg)" : "translateY(-50%) rotate(225deg)"
          }}
        />
      </div>
    </div>
  )
}