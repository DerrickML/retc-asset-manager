"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from "react"

const SelectContext = createContext({})

export function Select({ children, value, onValueChange, defaultValue, ...props }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || "")
  const [selectedLabel, setSelectedLabel] = useState("")
  const selectRef = useRef(null)

  // Update selected value when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleValueChange = (newValue, newLabel) => {
    setSelectedValue(newValue)
    setSelectedLabel(newLabel)
    setIsOpen(false)
    onValueChange?.(newValue)
  }

  return (
    <SelectContext.Provider value={{
      isOpen,
      setIsOpen,
      selectedValue,
      selectedLabel,
      handleValueChange
    }}>
      <div ref={selectRef} className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className = "", children, ...props }) {
  const { isOpen, setIsOpen } = useContext(SelectContext)
  
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <svg
        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export function SelectValue({ placeholder = "Select an option", ...props }) {
  const { selectedValue, selectedLabel } = useContext(SelectContext)
  
  return (
    <span className={selectedValue ? "text-gray-900" : "text-gray-500"} {...props}>
      {selectedLabel || selectedValue || placeholder}
    </span>
  )
}

export function SelectContent({ className = "", children, ...props }) {
  const { isOpen } = useContext(SelectContext)
  
  if (!isOpen) return null
  
  return (
    <div
      className={`absolute z-50 w-full mt-1 max-h-96 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg ${className}`}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

export function SelectItem({ className = "", children, value, ...props }) {
  const { selectedValue, handleValueChange } = useContext(SelectContext)
  const isSelected = selectedValue === value
  
  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${
        isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
      } ${className}`}
      onClick={() => handleValueChange(value, children)}
      {...props}
    >
      {isSelected && (
        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {children}
    </div>
  )
}