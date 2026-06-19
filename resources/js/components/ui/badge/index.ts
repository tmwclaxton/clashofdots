import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-none border-2 px-2 py-0.5 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none overflow-hidden shadow-[2px_2px_0_#3a2a1a]",
  {
    variants: {
      variant: {
        default:
          "border-[#3a2a1a] bg-[#c0392b] text-white dark:shadow-[2px_2px_0_#c8b89a]",
        secondary:
          "border-[#3a2a1a] bg-[#c9a86c] text-[#3a2a1a] dark:border-[#c8b89a] dark:bg-[#3a2e1c] dark:text-[#f5e8c8] dark:shadow-[2px_2px_0_#c8b89a]",
        destructive:
          "border-[#2a0e08] bg-[#c0392b] text-white dark:shadow-[2px_2px_0_#c8b89a]",
        outline:
          "border-[#3a2a1a] bg-[#f5e8c8] text-[#3a2a1a] dark:border-[#c8b89a] dark:bg-[#2a1e0a] dark:text-[#f5e8c8] dark:shadow-[2px_2px_0_#c8b89a]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
