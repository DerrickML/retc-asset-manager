"use client";

import React, { useState, useRef, useEffect } from "react";

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { open, setOpen })
      )}
    </div>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  open,
  setOpen,
  ...props
}) {
  const triggerProps = {
    onClick: () => setOpen(!open),
    ...props,
  };

  if (asChild && React.Children.count(children) === 1) {
    return React.cloneElement(React.Children.only(children), triggerProps);
  }

  return <button {...triggerProps}>{children}</button>;
}

export function DropdownMenuContent({
  children,
  className = "",
  open,
  setOpen,
  align = "end",
  ...props
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      <div
        className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-md ${
          align === "end" ? "right-0" : "left-0"
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export function DropdownMenuItem({
  className = "",
  asChild,
  children,
  onClick,
  ...props
}) {
  const itemProps = {
    className: `relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`,
    onClick,
    ...props,
  };

  if (asChild && React.Children.count(children) === 1) {
    return React.cloneElement(React.Children.only(children), itemProps);
  }

  return <div {...itemProps}>{children}</div>;
}

export function DropdownMenuSeparator({ className = "", ...props }) {
  return (
    <div className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} {...props} />
  );
}

export function DropdownMenuLabel({ children, className = "" }) {
  return (
    <div
      className={`px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </div>
  );
}

// Placeholder exports for compatibility
export const DropdownMenuGroup = ({ children }) => <>{children}</>;
export const DropdownMenuPortal = ({ children }) => <>{children}</>;
export const DropdownMenuSub = ({ children }) => <>{children}</>;
export const DropdownMenuSubContent = ({ children }) => <>{children}</>;
export const DropdownMenuSubTrigger = ({ children }) => <>{children}</>;
export const DropdownMenuRadioGroup = ({ children }) => <>{children}</>;
export const DropdownMenuCheckboxItem = ({ children }) => <>{children}</>;
export const DropdownMenuRadioItem = ({ children }) => <>{children}</>;
export const DropdownMenuShortcut = ({ children }) => <>{children}</>;
