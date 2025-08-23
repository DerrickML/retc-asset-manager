import React, { createContext, useContext, useState } from "react"
import { Label } from "./label"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Button } from "./button"
import { AlertCircle } from "lucide-react"

// Form Context for managing form state
const FormContext = createContext({})

/**
 * Form Provider
 * Manages form state, validation, and submission
 */
export function Form({ 
  children, 
  onSubmit, 
  initialValues = {}, 
  validation = {},
  className = "",
  ...props 
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name, value) => {
    if (!validation[name]) return null

    const rules = validation[name]
    
    // Required validation
    if (rules.required && (!value || value.toString().trim() === "")) {
      return rules.required.message || `${name} is required`
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength.value) {
      return rules.minLength.message || `${name} must be at least ${rules.minLength.value} characters`
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength.value) {
      return rules.maxLength.message || `${name} must be no more than ${rules.maxLength.value} characters`
    }

    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return rules.email.message || "Please enter a valid email address"
      }
    }

    // Custom validation function
    if (rules.validate && typeof rules.validate === "function") {
      return rules.validate(value, values)
    }

    return null
  }

  const setValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const setFieldTouched = (name) => {
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    Object.keys(validation).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allTouched = {}
    Object.keys(validation).forEach(fieldName => {
      allTouched[fieldName] = true
    })
    setTouched(allTouched)

    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      await onSubmit(values)
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const contextValue = {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    validateField
  }

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} className={className} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

/**
 * FormField Component
 * Wrapper for form fields with label, input, and error display
 */
export function FormField({ 
  name, 
  label, 
  required = false,
  children, 
  className = "",
  ...props 
}) {
  const { errors, touched } = useContext(FormContext)
  const hasError = touched[name] && errors[name]

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {label && (
        <Label htmlFor={name} className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
          {label}
        </Label>
      )}
      
      {children}
      
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errors[name]}</span>
        </div>
      )}
    </div>
  )
}

/**
 * FormInput Component
 * Input field that integrates with form state
 */
export function FormInput({ name, type = "text", placeholder, ...props }) {
  const { values, setValue, setFieldTouched, validateField } = useContext(FormContext)

  const handleChange = (e) => {
    setValue(name, e.target.value)
  }

  const handleBlur = () => {
    setFieldTouched(name)
    validateField(name, values[name])
  }

  return (
    <Input
      id={name}
      name={name}
      type={type}
      value={values[name] || ""}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  )
}

/**
 * FormTextarea Component
 * Textarea field that integrates with form state
 */
export function FormTextarea({ name, placeholder, rows = 3, ...props }) {
  const { values, setValue, setFieldTouched, validateField } = useContext(FormContext)

  const handleChange = (e) => {
    setValue(name, e.target.value)
  }

  const handleBlur = () => {
    setFieldTouched(name)
    validateField(name, values[name])
  }

  return (
    <Textarea
      id={name}
      name={name}
      value={values[name] || ""}
      placeholder={placeholder}
      rows={rows}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  )
}

/**
 * FormSelect Component
 * Select field that integrates with form state
 */
export function FormSelect({ 
  name, 
  placeholder = "Select an option",
  options = [],
  children,
  ...props 
}) {
  const { values, setValue, setFieldTouched } = useContext(FormContext)

  const handleValueChange = (value) => {
    setValue(name, value)
    setFieldTouched(name)
  }

  return (
    <Select value={values[name] || ""} onValueChange={handleValueChange} {...props}>
      <SelectTrigger id={name}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Render children if provided, otherwise render options */}
        {children || options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * FormSubmitButton Component
 * Submit button that shows loading state
 */
export function FormSubmitButton({ 
  children = "Submit", 
  loadingText = "Submitting...",
  disabled = false,
  ...props 
}) {
  const { isSubmitting } = useContext(FormContext)

  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      {...props}
    >
      {isSubmitting ? loadingText : children}
    </Button>
  )
}

/**
 * FormSection Component
 * Groups related form fields with optional title
 */
export function FormSection({ title, description, children, className = "" }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

/**
 * FormActions Component
 * Container for form action buttons with proper spacing
 */
export function FormActions({ children, align = "right", className = "" }) {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between"
  }

  return (
    <div className={`flex ${alignmentClasses[align]} space-x-4 pt-6 ${className}`}>
      {children}
    </div>
  )
}