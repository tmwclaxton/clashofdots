<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import { computed } from 'vue';
import LegalDocument from '@/components/LegalDocument.vue';
import LegalSection from '@/components/LegalSection.vue';
import { DISCORD_SERVER_URL, GITHUB_REPOSITORY_URL } from '@/lib/site';
import { privacy } from '@/routes/legal';

const appName = computed(() => usePage().props.name as string);
</script>

<template>
    <LegalDocument
        title="Terms and Conditions"
        :description="`Rules for using ${appName}, including accounts, gameplay, and community conduct.`"
        last-updated="June 21, 2026"
    >
        <LegalSection title="1. Acceptance of terms">
            <p>
                By accessing or using {{ appName }} (the &ldquo;Service&rdquo;),
                you agree to these Terms and Conditions. If you do not agree, do
                not use the Service.
            </p>
            <p>
                We may update these terms from time to time. Continued use after
                changes are posted means you accept the revised terms.
            </p>
        </LegalSection>

        <LegalSection title="2. Eligibility">
            <p>
                You must be at least 13 years old to use the Service. If you are
                under 18, you represent that you have permission from a parent or
                legal guardian.
            </p>
            <p>
                You are responsible for ensuring that your use of the Service is
                lawful in your jurisdiction.
            </p>
        </LegalSection>

        <LegalSection title="3. Accounts and guest play">
            <p>
                You may play as a registered user or as a guest, depending on the
                features available. You are responsible for safeguarding your
                account credentials and for activity that occurs under your
                account or guest session.
            </p>
            <p>
                Provide accurate information when creating an account. Do not
                impersonate others or use misleading display names intended to
                deceive other players.
            </p>
        </LegalSection>

        <LegalSection title="4. Acceptable use">
            <p>You agree not to:</p>
            <ul class="list-disc space-y-2 pl-5">
                <li>
                    Cheat, exploit bugs, use unauthorized automation, or interfere
                    with match integrity.
                </li>
                <li>
                    Harass, threaten, or abuse other players, including in game
                    chat or community spaces linked from the Service.
                </li>
                <li>
                    Attempt to gain unauthorized access to the Service, other
                    accounts, or underlying systems.
                </li>
                <li>
                    Upload or share unlawful, infringing, or harmful content
                    through maps, chat, or profile information.
                </li>
                <li>
                    Disrupt the Service through excessive load, scraping, or
                    other abusive behavior.
                </li>
            </ul>
            <p>
                We may suspend or terminate access for conduct that harms the
                community or the Service, with or without notice where
                appropriate.
            </p>
        </LegalSection>

        <LegalSection title="5. Game content and user submissions">
            <p>
                Maps, chat messages, profile details, and other content you
                submit remain your responsibility. By submitting content to the
                Service, you grant us a non-exclusive license to host, display,
                and distribute that content as needed to operate the game and
                related features.
            </p>
            <p>
                Do not submit content you do not have the right to share. We may
                remove content that violates these terms or applicable law.
            </p>
        </LegalSection>

        <LegalSection title="6. Intellectual property">
            <p>
                The Service, including its name, branding, software, and original
                assets, is owned by the project operators and protected by
                applicable intellectual property laws. Source code is made
                available under the project&apos;s open-source license on
                <a
                    :href="GITHUB_REPOSITORY_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="wod-link"
                    >GitHub</a
                >, which governs use of the codebase separately from these
                terms.
            </p>
        </LegalSection>

        <LegalSection title="7. Service availability">
            <p>
                {{ appName }} is provided on an &ldquo;as is&rdquo; and
                &ldquo;as available&rdquo; basis. We do not guarantee
                uninterrupted access, error-free gameplay, or preservation of
                match history, rankings, or user-generated content.
            </p>
            <p>
                We may modify, suspend, or discontinue features at any time,
                including for maintenance, balance changes, or operational
                reasons.
            </p>
        </LegalSection>

        <LegalSection title="8. Disclaimer and limitation of liability">
            <p>
                To the fullest extent permitted by law, the Service is provided
                without warranties of any kind, whether express or implied.
            </p>
            <p>
                We are not liable for indirect, incidental, special,
                consequential, or punitive damages, or for loss of data, profits,
                or goodwill arising from your use of the Service.
            </p>
        </LegalSection>

        <LegalSection title="9. Termination">
            <p>
                You may stop using the Service at any time. We may restrict or
                end your access if you violate these terms or if continued access
                would create risk for the Service or other users.
            </p>
        </LegalSection>

        <LegalSection title="10. Privacy">
            <p>
                Our
                <Link :href="privacy().url" class="wod-link"
                    >Privacy Policy</Link
                >
                explains how we collect and use information when you use the
                Service.
            </p>
        </LegalSection>

        <LegalSection title="11. Contact">
            <p>
                Questions about these terms can be raised through the project
                <a
                    :href="GITHUB_REPOSITORY_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="wod-link"
                    >GitHub repository</a
                >
                or our
                <a
                    :href="DISCORD_SERVER_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="wod-link"
                    >Discord community</a
                >.
            </p>
        </LegalSection>
    </LegalDocument>
</template>
