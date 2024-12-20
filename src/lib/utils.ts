import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for merging Tailwind CSS classes conditionally
 * 
 * This function combines clsx and twMerge to provide a powerful way to:
 * 1. Merge multiple class names
 * 2. Handle conditional classes
 * 3. Resolve Tailwind class conflicts
 * 
 * @example
 * ```tsx
 * // Basic usage
 * cn("base-class", "additional-class")
 * 
 * // With conditions
 * cn(
 *   "base-class",
 *   isActive && "active-class",
 *   variant === "primary" ? "primary-class" : "secondary-class"
 * )
 * 
 * // With Tailwind conflicts resolution
 * cn(
 *   "px-2 py-1",
 *   extended && "p-4" // This will properly override the previous padding
 * )
 * ```
 * 
 * @param inputs - Class names or conditional expressions
 * @returns Merged and cleaned class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
