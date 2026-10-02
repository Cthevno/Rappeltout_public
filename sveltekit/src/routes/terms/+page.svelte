<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import StylizedTitle from "$lib/components/StylizedTitle.svelte";
    import SettingsCard from "$lib/components/settings/SettingsCard.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import { ScrollText } from "@lucide/svelte";

    let { data } = $props();
</script>

<main class="font-serif m-0 min-h-screen bg-background flex flex-col pb-16">
    <Header
        text="Accueil"
        url={data.isConnected ? "/home" : "/"}
        title="Conditions d'utilisation"
        Icon={ScrollText}
        right="nothing"
        notifications={data.notifications}
        unread_count={data.unreadCount}
    />

    <div class="pt-15">
        <StylizedTitle title="✦ CONDITIONS GÉNÉRALES D'UTILISATION ✦" />
    </div>

    <div class="w-full max-w-[800px] mx-auto px-6 py-5 flex flex-col gap-6">
        <p class="text-[14px] text-grey text-center">
            Dernière mise à jour : 17 septembre 2026
        </p>

        <SettingsCard title="1. Objet" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Les présentes CGU régissent l'accès et l'utilisation de
                Rappeltout, une application de gestion de foyer partagé (tâches
                ménagères, to-do list personnelle, chat, gamification).
                Rappeltout est un projet étudiant réalisé dans le cadre du
                cursus de l'école 42, à but pédagogique et non commercial. En
                créant un compte, vous acceptez les présentes CGU ainsi que la
                <a href="/privacy" class="underline"
                    >Politique de Confidentialité</a
                >.
            </p>
        </SettingsCard>

        <SettingsCard title="2. Accès au service" red={false}>
            <ul
                class="list-disc list-inside text-[16px] text-black leading-relaxed space-y-2"
            >
                <li>
                    L'application est accessible aux mineurs, sous réserve, pour
                    les moins de 15 ans, de l'accord d'un titulaire de
                    l'autorité parentale (voir Politique de Confidentialité).
                </li>
                <li>
                    La création de compte se fait par email/mot de passe (avec
                    vérification en deux étapes) ou via Google OAuth.
                </li>
                <li>
                    Vous vous engagez à fournir des informations exactes et à
                    garder vos identifiants confidentiels. Vous êtes responsable
                    de toute activité effectuée depuis votre compte.
                </li>
                <li>Un compte est personnel et ne doit pas être partagé.</li>
            </ul>
        </SettingsCard>

        <SettingsCard
            title={`3. Fonctionnement des foyers ("maisons")`}
            red={false}
        >
            <ul
                class="list-disc list-inside text-[16px] text-black leading-relaxed space-y-2"
            >
                <li>
                    Un utilisateur peut créer un foyer ou en rejoindre un
                    existant via un code d'invitation ou une invitation envoyée
                    par un membre.
                </li>
                <li>
                    Chaque membre d'un foyer partage avec les autres membres :
                    son pseudo, son avatar, les tâches partagées, les messages
                    du chat et les statistiques de jeu liées au foyer.
                </li>
                <li>
                    Un utilisateur peut quitter un foyer à tout moment ; son
                    compte n'est pas supprimé pour autant.
                </li>
            </ul>
        </SettingsCard>

        <SettingsCard title="4. Comportement des utilisateurs" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                En utilisant le chat et les autres fonctionnalités partagées,
                vous vous engagez à ne pas publier de contenu illicite,
                injurieux, discriminatoire, ou portant atteinte aux droits de
                tiers. L'équipe se réserve le droit de suspendre ou supprimer un
                compte en cas de manquement manifeste à cette règle.
            </p>
        </SettingsCard>

        <SettingsCard
            title="5. Propriété intellectuelle et thématique"
            red={false}
        >
            <p class="text-[16px] text-black leading-relaxed">
                Rappeltout utilise, à des fins purement ludiques et non
                commerciales, des éléments thématiques inspirés de l'univers
                Harry Potter (maisons, "monstres", vocabulaire). Rappeltout
                n'est affilié ni approuvé par J.K. Rowling, Warner Bros. ou
                toute entité détentrice de droits sur cet univers. Ces
                références sont utilisées dans le cadre d'un projet étudiant non
                commercial.
            </p>
            <p class="text-[16px] text-black leading-relaxed">
                Le code source de Rappeltout est hébergé sur un dépôt privé et
                n'est pas open-source. Le code source et les contenus propres à
                Rappeltout (design, textes, logo) sont la propriété exclusive de
                ses auteurs (cafavier, ctheveno, juportie, mlaussel, vakozhev).
                Toute reproduction ou réutilisation sans autorisation est
                interdite.
            </p>
        </SettingsCard>

        <SettingsCard title="6. Disponibilité et responsabilité" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Rappeltout est un projet étudiant fourni "en l'état", sans
                garantie de disponibilité continue, d'absence d'erreurs ou de
                pérennité du service. L'équipe ne saurait être tenue responsable
                des interruptions de service, pertes de données ou dommages
                indirects résultant de l'utilisation de l'application.
            </p>
        </SettingsCard>

        <SettingsCard title="7. Suppression de compte" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Vous pouvez supprimer votre compte à tout moment depuis les
                paramètres. Cette action entraîne la suppression définitive de
                vos données personnelles conformément à la
                <a href="/privacy" class="underline"
                    >Politique de Confidentialité</a
                >.
            </p>
        </SettingsCard>

        <SettingsCard title="8. Modification des CGU" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Les présentes CGU peuvent être modifiées ; la date de dernière
                mise à jour figure en haut de page.
            </p>
        </SettingsCard>

        <SettingsCard title="9. Droit applicable" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Les présentes CGU sont soumises au droit français.
            </p>
        </SettingsCard>

        <SettingsCard title="10. Contact" red={false}>
            <p class="text-[16px] text-black leading-relaxed">
                Pour toute question :
                <span class="font-bold">rappeltout42@gmail.com</span>
            </p>
        </SettingsCard>
    </div>

    <div class="pt-8">
        <AboutLink />
    </div>
    <p class="flex justify-center">© 2026 Rappeltout</p>
</main>
