<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import StylizedTitle from "$lib/components/StylizedTitle.svelte";
    import SettingsCard from "$lib/components/settings/SettingsCard.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import { Lock } from "@lucide/svelte";

    let { data } = $props();
</script>

<main class="font-serif m-0 min-h-screen bg-background flex flex-col pb-16">
    <Header
        text="Accueil"
        url={data.isConnected ? "/home" : "/"}
        title="Confidentialité"
        Icon={Lock}
        right="nothing"
        notifications={data.notifications}
        unread_count={data.unreadCount}
    />

    <div class="pt-15">
        <StylizedTitle title="✦ POLITIQUE DE CONFIDENTIALITÉ ✦" />
    </div>

    <div class="w-full max-w-[800px] mx-auto px-6 py-5 flex flex-col gap-6">
        <p class="text-[14px] text-grey text-center">
            Dernière mise à jour : 17 septembre 2026
        </p>

        <SettingsCard title="1. Qui sommes-nous" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Rappeltout est un projet étudiant réalisé dans le cadre du
                cursus 42 (projet "Transcendence", sujet libre) par cafavier,
                ctheveno, juportie, mlaussel et vakozhev. Ce n'est pas un
                service commercial : l'application est développée à des fins
                pédagogiques et d'évaluation.
            </p>
            <p class="text-[16px] text-black leading-relaxed">
                Pour toute question relative à vos données personnelles, vous
                pouvez contacter l'équipe à l'adresse :
                <span class="font-bold">rappeltout42@gmail.com</span>.
            </p>
        </SettingsCard>

        <SettingsCard title="2. Données que nous collectons" red={false}>
            <ul
                class="list-disc list-inside text-[16px] text-black leading-relaxed space-y-2"
            >
                <li>
                    <span class="font-bold">Adresse email</span> — à la création
                    de compte, pour l'identifiant de connexion, l'envoi du code 2FA
                    et la réinitialisation de mot de passe.
                </li>
                <li>
                    <span class="font-bold">Pseudo</span> — pour l'identification
                    au sein de l'application et des foyers.
                </li>
                <li>
                    <span class="font-bold">Mot de passe</span> — hors connexion
                    Google, stocké sous forme hachée (bcrypt), jamais en clair.
                </li>
                <li>
                    <span class="font-bold"
                        >Informations de connexion Google</span
                    > (email, nom) — si vous utilisez la connexion via Google OAuth.
                </li>
                <li>
                    <span class="font-bold"
                        >Code de vérification à 6 chiffres (2FA)</span
                    > — à chaque connexion par email, donnée temporaire qui expire
                    rapidement.
                </li>
                <li>
                    <span class="font-bold"
                        >Jeton de réinitialisation de mot de passe</span
                    > — lors d'une demande de "mot de passe oublié", donnée temporaire.
                </li>
                <li>
                    <span class="font-bold">Avatar, thème de maison, rôle</span>
                    — pour la personnalisation de votre profil.
                </li>
                <li>
                    <span class="font-bold"
                        >Contenu des tâches personnelles et partagées</span
                    > — pour la fonctionnalité de gestion de foyer.
                </li>
                <li>
                    <span class="font-bold">Messages du chat</span> — pour la fonctionnalité
                    de communication entre membres d'un même foyer.
                </li>
                <li>
                    <span class="font-bold">Statistiques de jeu</span> (XP, dégâts,
                    monstres vaincus) — pour la fonctionnalité de gamification.
                </li>
                <li>
                    <span class="font-bold">Cookie de session</span> — pour maintenir
                    votre connexion (voir section Cookies).
                </li>
            </ul>
            <p class="text-[16px] text-black leading-relaxed">
                Nous ne collectons aucune donnée de paiement, de
                géolocalisation, ni de donnée dite "sensible" au sens du RGPD.
            </p>
        </SettingsCard>

        <SettingsCard title="3. Base légale et finalités" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Le traitement de vos données repose sur :
            </p>
            <ul
                class="list-disc list-inside text-[16px] text-black leading-relaxed space-y-1"
            >
                <li>
                    L'exécution du service que vous nous demandez en créant un
                    compte (authentification, gestion de foyer, chat, tâches) ;
                </li>
                <li>
                    L'intérêt légitime à sécuriser l'accès au service (2FA,
                    cookies de session, journaux techniques) ;
                </li>
                <li>
                    Le cas échéant, votre consentement lorsque vous choisissez
                    de vous connecter via Google.
                </li>
            </ul>
        </SettingsCard>

        <SettingsCard title="4. Destinataires des données" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Vos données ne sont ni vendues, ni louées, ni transmises à des
                tiers à des fins commerciales. Elles peuvent néanmoins être
                traitées par :
            </p>
            <ul
                class="list-disc list-inside text-[16px] text-black leading-relaxed space-y-1"
            >
                <li>
                    <span class="font-bold">Google</span> — uniquement si vous utilisez
                    la connexion "Se connecter avec Google".
                </li>
                <li>
                    <span class="font-bold">Le service d'envoi d'emails</span> utilisé
                    pour transmettre les codes 2FA et les emails de réinitialisation
                    de mot de passe (rappeltout42@gmail.com via Gmail/Nodemailer).
                </li>
                <li>
                    <span class="font-bold"
                        >Les autres membres de votre foyer</span
                    >, pour les données que vous partagez volontairement
                    (pseudo, avatar, messages de chat, tâches partagées,
                    statistiques de jeu) — c'est le fonctionnement normal de
                    l'application.
                </li>
            </ul>
        </SettingsCard>

        <SettingsCard title="5. Durée de conservation" red={false}>
            <ul
                class="list-disc list-inside text-[16px] text-black leading-relaxed space-y-2"
            >
                <li>
                    Les données de votre compte sont conservées tant que
                    celui-ci existe.
                </li>
                <li>
                    Le code 2FA et le jeton de réinitialisation de mot de passe
                    sont des données temporaires supprimées après expiration ou
                    utilisation.
                </li>
                <li>
                    Les sessions de connexion expirent automatiquement après 24
                    heures.
                </li>
                <li>
                    Si vous supprimez votre compte, l'ensemble de vos données
                    personnelles (profil, tâches, messages, statistiques) est
                    supprimé de la base de données. Le seul cas particulier :
                    votre nom d'auteur peut être conservé de façon anonymisée
                    dans l'historique de combat partagé du foyer (le compte
                    associé n'existe plus), afin de ne pas altérer l'historique
                    des autres membres.
                </li>
                <li>
                    Quitter un foyer (sans supprimer votre compte) ne supprime
                    pas votre compte : seule votre appartenance à ce foyer est
                    retirée.
                </li>
            </ul>
        </SettingsCard>

        <SettingsCard title="6. Cookies" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Rappeltout utilise un unique cookie technique, strictement
                nécessaire au fonctionnement du service : un cookie de session (<code
                    >session</code
                >), sécurisé (HTTPS uniquement), inaccessible en JavaScript (<code
                    >httpOnly</code
                >), expirant après 24 heures. Il ne contient aucune donnée
                personnelle directement (un identifiant aléatoire) et n'est pas
                utilisé à des fins publicitaires ou de suivi. Aucun bandeau de
                consentement n'est requis pour ce type de cookie strictement
                nécessaire.
            </p>
        </SettingsCard>

        <SettingsCard title="7. Sécurité" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Les mots de passe sont hachés et ne sont jamais stockés ni
                transmis en clair. Les connexions au site sont chiffrées
                (HTTPS/TLS). L'accès aux données est limité aux besoins
                fonctionnels de l'application.
            </p>
        </SettingsCard>

        <SettingsCard title="8. Vos droits" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Conformément au RGPD, vous disposez d'un droit d'accès, de
                rectification, de suppression, de limitation et de portabilité
                de vos données, ainsi que d'un droit d'opposition. Vous pouvez
                exercer ces droits :
            </p>
            <ul
                class="list-disc list-inside text-[16px] text-black leading-relaxed space-y-1"
            >
                <li>
                    directement depuis les paramètres de votre compte
                    (modification du pseudo, du mot de passe, suppression du
                    compte) ;
                </li>
                <li>ou en nous contactant à rappeltout42@gmail.com.</li>
            </ul>
            <p class="text-[16px] text-black leading-relaxed">
                Vous disposez également du droit d'introduire une réclamation
                auprès de la CNIL (www.cnil.fr).
            </p>
        </SettingsCard>

        <SettingsCard title="9. Mineurs" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Rappeltout est accessible aux utilisateurs mineurs. Si vous avez
                moins de 15 ans, la création d'un compte doit se faire avec
                l'accord d'un titulaire de l'autorité parentale, conformément à
                la réglementation française sur la protection des données des
                mineurs.
            </p>
        </SettingsCard>

        <SettingsCard title="10. Portée du projet" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Rappeltout est un projet étudiant réalisé dans un cadre
                pédagogique (école 42) et n'a pas vocation commerciale. Il est
                susceptible d'être hébergé de façon temporaire à des fins de
                démonstration ou d'évaluation.
            </p>
        </SettingsCard>

        <SettingsCard title="11. Modification de cette politique" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Cette politique peut être mise à jour ; la date de dernière
                modification est indiquée en haut de page.
            </p>
        </SettingsCard>
    </div>

    <div class="pt-8">
        <AboutLink />
    </div>
    <p class="flex justify-center">© 2026 Rappeltout</p>
</main>
