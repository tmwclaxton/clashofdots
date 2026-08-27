<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Menu } from 'lucide-vue-next';
import { ref } from 'vue';
import GameLogoMark from '@/components/GameLogoMark.vue';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrentUrl } from '@/composables/useCurrentUrl';
import { toUrl } from '@/lib/utils';
import { home } from '@/routes';
import type { NavItem } from '@/types';

type Props = {
    navItems: NavItem[];
    externalLinks?: NavItem[];
    communityLabel?: string;
    showBrand?: boolean;
};

withDefaults(defineProps<Props>(), {
    externalLinks: () => [],
    communityLabel: 'Community',
    showBrand: true,
});

const open = ref(false);
const { isCurrentOrParentUrl } = useCurrentUrl();

function closeDrawer(): void {
    open.value = false;
}
</script>

<template>
    <Sheet v-model:open="open">
        <SheetTrigger as-child>
            <Button
                variant="outline"
                size="icon"
                class="size-9 rounded-none"
                aria-label="Open navigation menu"
            >
                <Menu class="size-5" />
            </Button>
        </SheetTrigger>
        <SheetContent
            side="left"
            class="wod-nav-drawer relative flex w-[min(100vw-2rem,20rem)] flex-col gap-0 overflow-hidden border-r-4 border-foreground p-0"
        >
            <SheetTitle class="sr-only">Navigation menu</SheetTitle>
            <SheetHeader
                v-if="showBrand"
                class="relative border-b-4 border-foreground/30 px-4 py-4 text-left"
            >
                <Link
                    :href="home().url"
                    class="flex items-center gap-2.5"
                    @click="closeDrawer"
                >
                    <GameLogoMark />
                    <div>
                        <p
                            class="font-display text-base leading-tight font-bold"
                        >
                            Clash of Dots
                        </p>
                        <p class="wod-tagline text-xs">
                            Plan first, fight second
                        </p>
                    </div>
                </Link>
            </SheetHeader>

            <nav
                class="flex-1 overflow-y-auto px-2 py-3"
                aria-label="Main"
            >
                <ul class="space-y-0.5">
                    <li v-for="item in navItems" :key="item.title">
                        <Link
                            :href="item.href"
                            class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-foreground/10"
                            :class="
                                isCurrentOrParentUrl(item.href)
                                    ? 'wod-nav-active bg-foreground/10'
                                    : ''
                            "
                            @click="closeDrawer"
                        >
                            <component
                                :is="item.icon"
                                class="size-4 shrink-0"
                                aria-hidden="true"
                            />
                            {{ item.title }}
                        </Link>
                    </li>
                </ul>
            </nav>

            <div
                v-if="externalLinks.length > 0 || $slots.footer"
                class="mt-auto border-t-4 border-foreground/30 px-4 py-4"
            >
                <template v-if="externalLinks.length > 0">
                    <p
                        class="mb-2 text-xs font-semibold tracking-wide text-foreground/70 uppercase"
                    >
                        {{ communityLabel }}
                    </p>
                    <div class="flex flex-col gap-1">
                        <a
                            v-for="item in externalLinks"
                            :key="item.title"
                            :href="toUrl(item.href)"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/10"
                            @click="closeDrawer"
                        >
                            <component
                                :is="item.icon"
                                class="size-4 shrink-0"
                                aria-hidden="true"
                            />
                            {{ item.title }}
                        </a>
                    </div>
                </template>
                <div v-if="$slots.footer" class="mt-4 space-y-2">
                    <slot name="footer" :close="closeDrawer" />
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
