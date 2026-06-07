<script setup lang="ts">
import { Monitor, Moon, Sun } from 'lucide-vue-next';
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance, type Appearance } from '@/composables/useAppearance';

const { appearance, updateAppearance } = useAppearance();

const options = [
    { value: 'light' as const, label: 'Light', Icon: Sun },
    { value: 'dark' as const, label: 'Dark', Icon: Moon },
    { value: 'system' as const, label: 'System', Icon: Monitor },
];

const ActiveIcon = computed(() => {
    if (appearance.value === 'dark') {
        return Moon;
    }

    if (appearance.value === 'light') {
        return Sun;
    }

    return Monitor;
});

function selectTheme(value: Appearance): void {
    updateAppearance(value);
}
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button
                variant="ghost"
                size="icon"
                class="wod-nav-ghost rounded-md"
                aria-label="Toggle theme"
            >
                <component :is="ActiveIcon" class="size-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem
                v-for="{ value, label, Icon } in options"
                :key="value"
                class="cursor-pointer"
                @click="selectTheme(value)"
            >
                <Icon class="mr-2 size-4" />
                <span>{{ label }}</span>
                <span
                    v-if="appearance === value"
                    class="ml-auto text-xs text-muted-foreground"
                >
                    ✓
                </span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
