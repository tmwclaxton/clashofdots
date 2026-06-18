<script setup lang="ts">
import { Form, Head, usePage } from '@inertiajs/vue3';
import { Shuffle } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/DeleteUser.vue';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AVATAR_STYLES,
    avatarUrl,
    resolveAvatarSeed,
} from '@/composables/useAvatar';
import type { AvatarStyle } from '@/composables/useAvatar';
import { edit } from '@/routes/profile';

type Props = {
    status?: string;
};

defineProps<Props>();

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Profile settings',
                href: edit(),
            },
        ],
    },
});

const page = usePage();
const user = computed(() => page.props.auth.user);

const selectedStyle = ref<AvatarStyle>(
    (user.value?.avatar_style as AvatarStyle) ?? 'pixel-art',
);
const previewSeed = ref<string>(resolveAvatarSeed(user.value ?? {}));

function randomiseSeed(): void {
    previewSeed.value =
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);
}
</script>

<template>
    <Head title="Profile settings" />

    <h1 class="sr-only">Profile settings</h1>

    <div class="flex flex-col space-y-6">
        <Heading
            variant="small"
            title="Profile information"
            description="Update your name and email address"
        />

        <Form
            v-bind="ProfileController.update.form()"
            class="space-y-6"
            v-slot="{ errors, processing }"
        >
            <div class="grid gap-2">
                <Label for="name">Name</Label>
                <Input
                    id="name"
                    class="mt-1 block w-full"
                    name="name"
                    :default-value="user?.name ?? ''"
                    required
                    autocomplete="name"
                    placeholder="Full name"
                />
                <InputError class="mt-2" :message="errors.name" />
            </div>

            <div class="grid gap-2">
                <Label for="game_display_name">Game display name</Label>
                <Input
                    id="game_display_name"
                    class="mt-1 block w-full"
                    name="game_display_name"
                    :default-value="user?.game_display_name ?? ''"
                    maxlength="50"
                    placeholder="Leave blank to use your account name"
                />
                <p class="text-sm text-muted-foreground">
                    The name other players see in battle lobbies and games.
                    Defaults to your account name if left blank.
                </p>
                <InputError class="mt-2" :message="errors.game_display_name" />
            </div>

            <div class="grid gap-2">
                <Label for="email">Email address</Label>
                <Input
                    id="email"
                    type="email"
                    class="mt-1 block w-full"
                    name="email"
                    :default-value="user?.email ?? ''"
                    required
                    autocomplete="username"
                    placeholder="Email address"
                    disabled
                />
                <InputError class="mt-2" :message="errors.email" />
            </div>

            <!-- Avatar style picker -->
            <div class="grid gap-3">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <Label>Avatar style</Label>
                        <p class="mt-1 text-sm text-muted-foreground">
                            Choose how your avatar looks to other players.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        class="shrink-0 gap-2"
                        @click="randomiseSeed"
                    >
                        <Shuffle class="size-3.5" />
                        Randomise
                    </Button>
                </div>

                <input
                    type="hidden"
                    name="avatar_style"
                    :value="selectedStyle"
                />
                <input type="hidden" name="avatar_seed" :value="previewSeed" />

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <button
                        v-for="style in AVATAR_STYLES"
                        :key="style.value"
                        type="button"
                        @click="selectedStyle = style.value"
                        :class="[
                            'flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors',
                            selectedStyle === style.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/50',
                        ]"
                        :aria-pressed="selectedStyle === style.value"
                    >
                        <img
                            :src="avatarUrl(previewSeed, style.value)"
                            :alt="style.label"
                            class="size-14 rounded-full"
                            loading="lazy"
                        />
                        <span class="text-xs leading-tight font-medium">{{
                            style.label
                        }}</span>
                    </button>
                </div>
                <InputError :message="errors.avatar_style" />
            </div>

            <div class="flex items-center gap-4">
                <Button :disabled="processing" data-test="update-profile-button"
                    >Save</Button
                >
            </div>
        </Form>
    </div>

    <DeleteUser />
</template>
