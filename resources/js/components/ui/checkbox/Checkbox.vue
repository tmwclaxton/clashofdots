<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Check } from "lucide-vue-next"
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :class="
      cn('peer size-5 shrink-0 rounded-none border-4 border-[#3a2a1a] bg-[#f5e8c8] shadow-[inset_2px_2px_0_#c9a86c] outline-none transition-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#c0392b] data-[state=checked]:border-[#2a0e08] data-[state=checked]:text-white dark:border-[#c8b89a] dark:bg-[#2a1e0a] dark:shadow-[inset_2px_2px_0_#1a0e04] dark:data-[state=checked]:bg-[#c0392b] dark:data-[state=checked]:border-[#c8b89a]',
         props.class)"
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="grid place-content-center text-current transition-none"
    >
      <slot v-bind="slotProps">
        <Check class="size-3.5" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
