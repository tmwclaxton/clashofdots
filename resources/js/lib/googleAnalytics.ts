import { router } from '@inertiajs/vue3';

const measurementId = 'G-LQBM68RR2K';

function trackPageView(url: string): void {
    if (typeof window.gtag !== 'function') {
        return;
    }

    window.gtag('config', measurementId, {
        page_path: url,
    });
}

export function initializeGoogleAnalytics(): void {
    router.on('finish', (event) => {
        const url = (event as CustomEvent).detail?.page?.url;

        if (!url) {
            return;
        }

        trackPageView(url);
    });
}
