import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex h-12 sm:h-14 items-center justify-start rounded-xl bg-slate-800/80 backdrop-blur-lg border border-cyan-400/30 p-1 text-foreground shadow-lg shadow-blue-500/20",
      "overflow-x-auto scrollbar-hidden w-full",
      "scroll-smooth overscroll-x-contain",
      "gap-0.5 sm:gap-1",
      // Scrollbar styling for better mobile experience
      "[&::-webkit-scrollbar]:h-1",
      "[&::-webkit-scrollbar-track]:bg-transparent", 
      "[&::-webkit-scrollbar-thumb]:bg-cyan-400/30",
      "[&::-webkit-scrollbar-thumb]:rounded-full",
      // Add scroll indicators
      "relative",
      "before:content-[''] before:absolute before:right-0 before:top-0 before:bottom-0 before:w-4 before:bg-gradient-to-l before:from-slate-800/80 before:to-transparent before:pointer-events-none before:z-10",
      "after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-slate-800/80 after:to-transparent after:pointer-events-none after:z-10",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-cyan-600/20",
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25",
      "px-2 py-2 text-xs font-jetbrains font-bold uppercase tracking-wider",
      "sm:px-3 sm:py-2.5 sm:text-sm",
      "min-w-[60px] sm:min-w-[80px] min-h-[40px] sm:min-h-[44px] touch-manipulation",
      "flex-shrink-0",
      "relative z-20", // Ensure tabs appear above scroll indicators
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
