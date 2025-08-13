import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 backdrop-blur-sm bg-gradient-to-br from-slate-900/90 via-blue-900/30 to-purple-900/30 border-cyan-400/40 shadow-xl [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-cyan-400 font-jetbrains",
  {
    variants: {
      variant: {
        default: "text-cyan-50 border-cyan-400/40",
        destructive:
          "border-red-400/50 text-red-100 bg-gradient-to-br from-red-900/90 via-red-800/30 to-purple-900/30 [&>svg]:text-red-400",
        warning:
          "border-amber-400/50 text-amber-100 bg-gradient-to-br from-amber-900/90 via-amber-800/30 to-orange-900/30 [&>svg]:text-amber-400",
        success:
          "border-emerald-400/50 text-emerald-100 bg-gradient-to-br from-emerald-900/90 via-emerald-800/30 to-green-900/30 [&>svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-jetbrains font-semibold leading-none tracking-tight text-cyan-100 uppercase text-sm", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed text-cyan-200/90 font-inter", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
