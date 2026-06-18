import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createInertiaApp } from '@inertiajs/vue3';
import { createPinia } from 'pinia';
import { createApp, createSSRApp, h } from 'vue';
import { initializeTheme } from '@/composables/useAppearance';
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';
import { initializeFlashToast } from '@/lib/flashToast';
import { initializeGoogleAnalytics } from '@/lib/googleAnalytics';

library.add(fas, far, fab);

const appName = import.meta.env.VITE_APP_NAME || 'Clash of Dots';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'Welcome':
            case name === 'games/Play':
                return null;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    progress: {
        color: '#e53935',
    },
    setup({ el, App, props, plugin }) {
        const app = (typeof window === 'undefined' ? createSSRApp : createApp)({
            render: () => h(App, props),
        })
            .use(plugin)
            .use(createPinia())
            .component('font-awesome-icon', FontAwesomeIcon);

        if (el) {
            app.mount(el);
        }

        return app;
    },
});

if (typeof window !== 'undefined') {
    // This will set light / dark mode on page load...
    initializeTheme();

    // This will listen for flash toast data from the server...
    initializeFlashToast();

    // Track Inertia navigations for Google Analytics...
    initializeGoogleAnalytics();
}
