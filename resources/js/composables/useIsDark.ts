import { onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';

export type UseIsDarkReturn = {
    isDark: Ref<boolean>;
};

export function useIsDark(): UseIsDarkReturn {
    const isDark = ref(false);

    function update(): void {
        if (typeof document === 'undefined') {
            return;
        }

        isDark.value = document.documentElement.classList.contains('dark');
    }

    let observer: MutationObserver | null = null;

    onMounted(() => {
        update();

        observer = new MutationObserver(update);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
    });

    onUnmounted(() => {
        observer?.disconnect();
    });

    return { isDark };
}
