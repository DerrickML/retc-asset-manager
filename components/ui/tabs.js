"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react"

const TabsContext = createContext({})

function Tabs({ children, defaultValue, value, onValueChange, className = "", ...props }) {
  const [activeTab, setActiveTab] = useState(value || defaultValue || "")

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  const handleValueChange = (newValue) => {
    setActiveTab(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleValueChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className = "", ...props }) {
  return (
    <div className={`org-tabs-list ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

function TabsTrigger({ children, value, className = "", ...props }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  const triggerClasses = [
    "org-tabs-trigger",
    isActive ? "org-tabs-trigger--active" : "org-tabs-trigger--inactive",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      className={triggerClasses}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ children, value, className = "", ...props }) {
  const { activeTab } = useContext(TabsContext)

  if (activeTab !== value) {
    return null
  }

  return (
    <div
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
}