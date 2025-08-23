/**
 * Separator component for dividing content sections
 */

export function Separator({ 
  orientation = "horizontal", 
  className = "", 
  ...props 
}) {
  const baseClasses = "shrink-0 bg-border"
  const orientationClasses = {
    horizontal: "h-[1px] w-full",
    vertical: "h-full w-[1px]"
  }

  const classes = `${baseClasses} ${orientationClasses[orientation]} ${className}`

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={classes}
      {...props}
    />
  )
}

export default Separator