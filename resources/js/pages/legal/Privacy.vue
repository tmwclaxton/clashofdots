<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import { computed } from 'vue';
import LegalDocument from '@/components/LegalDocument.vue';
import LegalSection from '@/components/LegalSection.vue';
import { DISCORD_SERVER_URL, GITHUB_REPOSITORY_URL } from '@/lib/site';
import { terms } from '@/routes/legal';

const appName = computed(() => usePage().props.name as string);
</script>

<template>
    <LegalDocument
        title="Privacy Policy"
        :description="`How ${appName} collects, uses, and protects information when you play or browse the site.`"
        last-updated="June 21, 2026"
    >
        <LegalSection title="1. Overview">
            <p>
                This Privacy Policy describes how {{ appName }} (the
                &ldquo;Service&rdquo;) handles information when you visit the
                site, create an account, join matches, or use related features.
            </p>
            <p>
                By using the Service, you agree to the practices described here.
                Please also read our
                <Link :href="terms().url" class="wod-link"
                    >Terms and Conditions</Link
                >.
            </p>
        </LegalSection>

        <LegalSection title="2. Information we collect">
            <p>Depending on how you use the Service, we may process:</p>
            <ul class="list-disc space-y-2 pl-5">
                <li>
                    <strong class="text-foreground">Account information</strong>
                    such as your name, email address, and authentication
                    identifiers when you register or sign in.
                </li>
                <li>
                    <strong class="text-foreground">Gameplay data</strong>
                    including lobby participation, match results, orders,
                    rankings, map submissions, votes, and in-game chat messages.
                </li>
                <li>
                    <strong class="text-foreground">Guest session data</strong>
                    such as a guest identifier stored in your browser session so
                    you can join games without an account.
                </li>
                <li>
                    <strong class="text-foreground">Technical data</strong>
                    including IP address, browser type, device information, and
                    server logs used for security, debugging, and performance.
                </li>
                <li>
                    <strong class="text-foreground">Preferences</strong> such as
                    appearance settings and cookies that remember UI choices.
                </li>
            </ul>
        </LegalSection>

        <LegalSection title="3. How we use information">
            <p>We use collected information to:</p>
            <ul class="list-disc space-y-2 pl-5">
                <li>Provide, operate, and improve the game and website.</li>
                <li>Authenticate users and maintain sessions.</li>
                <li>Match players, run simulations, and display leaderboards.</li>
                <li>Moderate abuse, enforce our terms, and protect the Service.</li>
                <li>Diagnose errors, monitor performance, and prevent fraud.</li>
                <li>Communicate important service-related notices when needed.</li>
            </ul>
        </LegalSection>

        <LegalSection title="4. Legal bases">
            <p>
                Where applicable law requires a legal basis, we process personal
                data to perform our contract with you, pursue legitimate interests
                such as securing and improving the Service, comply with legal
                obligations, and, where required, with your consent.
            </p>
        </LegalSection>

        <LegalSection title="5. Sharing and disclosure">
            <p>
                We do not sell your personal information. We may share information
                with service providers that help us host infrastructure, deliver
                email, or operate real-time features, subject to appropriate
                safeguards.
            </p>
            <p>
                We may also disclose information when required by law, to protect
                rights and safety, or to investigate violations of our terms.
            </p>
            <p>
                Public areas of the Service, such as leaderboards, published maps,
                and in-game chat visible to other participants, may display
                information you choose to share there.
            </p>
        </LegalSection>

        <LegalSection title="6. Cookies and local storage">
            <p>
                We use cookies and similar browser storage to keep you signed in,
                remember preferences such as theme, and maintain guest game
                sessions. You can control cookies through your browser settings,
                though some features may not work correctly if essential cookies
                are disabled.
            </p>
        </LegalSection>

        <LegalSection title="7. Data retention">
            <p>
                We retain information for as long as needed to operate the
                Service, comply with legal obligations, resolve disputes, and
                enforce agreements. Match history, maps, and profile data may
                remain available until deleted by you or removed by us under our
                policies.
            </p>
        </LegalSection>

        <LegalSection title="8. Security">
            <p>
                We use reasonable technical and organizational measures to
                protect information. No online service can guarantee absolute
                security, so please use a strong password and keep credentials
                private.
            </p>
        </LegalSection>

        <LegalSection title="9. Your choices and rights">
            <p>
                Registered users can update profile information through account
                settings where available. Depending on your location, you may have
                rights to access, correct, delete, or restrict certain processing
                of your personal data.
            </p>
            <p>
                To make a privacy-related request, contact us using the channels
                listed below.
            </p>
        </LegalSection>

        <LegalSection title="10. Children">
            <p>
                The Service is not directed to children under 13, and we do not
                knowingly collect personal information from them. If you believe a
                child has provided personal information, contact us so we can take
                appropriate action.
            </p>
        </LegalSection>

        <LegalSection title="11. International users">
            <p>
                Information may be processed in countries where our hosting
                providers operate. By using the Service, you understand that your
                information may be transferred to and processed in those
                locations.
            </p>
        </LegalSection>

        <LegalSection title="12. Changes to this policy">
            <p>
                We may update this Privacy Policy from time to time. When we do,
                we will revise the &ldquo;Last updated&rdquo; date at the top of
                this page. Material changes may also be communicated through the
                Service where appropriate.
            </p>
        </LegalSection>

        <LegalSection title="13. Contact">
            <p>
                Privacy questions or requests can be sent through the project
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
