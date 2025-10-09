import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-98",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 hover:scale-105",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 hover:scale-105",
        outline:
          "border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 rounded-xl transition-all duration-150 ease-out hover:scale-105",
        secondary:
          "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 shadow-md hover:shadow-lg rounded-xl transition-all duration-200 hover:scale-105",
        ghost:
          "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 rounded-xl transition-all duration-150 ease-out hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline rounded-xl transition-all duration-150 ease-out",
        gradient: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 rounded-xl transition-all duration-200",
        fun: "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 rounded-xl transition-all duration-200 animate-pulse-glow",
        success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 rounded-xl transition-all duration-200",
      },
      size: {
        default: "h-12 px-6 py-3 text-base has-[>svg]:px-4", // Kid-friendly sizing
        sm: "h-10 px-4 py-2 text-sm has-[>svg]:px-3 rounded-lg",
        lg: "h-14 px-8 py-4 text-lg has-[>svg]:px-6 rounded-xl", // Extra large for main actions
        xl: "h-16 px-10 py-5 text-xl has-[>svg]:px-8 rounded-2xl", // Hero buttons
        icon: "size-12 rounded-xl", // Larger tap targets
        "icon-sm": "size-10 rounded-lg",
        "icon-lg": "size-14 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
