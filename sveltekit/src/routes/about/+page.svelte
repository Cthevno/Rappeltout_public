<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import AboutHeader from "$lib/components/about/AboutHeader.svelte";
    import AboutCard1 from "$lib/components/about/AboutCard1.svelte";
    import AboutCard2 from "$lib/components/about/AboutCard2.svelte";
    import AboutCard3 from "$lib/components/about/AboutCard3.svelte";
    import AboutFAQ from "$lib/components/about/AboutFAQ.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import StylizedTitle from "$lib/components/StylizedTitle.svelte";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
    import {
        Info,
        WandSparkles,
        Shield,
        Sparkles,
        ListTodo,
        Skull,
        Star,
        Users,
        ShoppingCart,
        Wallet,
        Calendar,
        MessageCircle,
        Bell,
    } from "@lucide/svelte";

    let { data } = $props();
</script>

<main class="font-serif m-0 min-h-screen bg-background flex flex-col pb-16">
    <!--HEADER-->
    <Header
        text="Accueil"
        url="/home"
        title="À propos"
        Icon={Info}
        right="nothing"
        notifications={data.notifications}
        unread_count={data.unreadCount}
    />

    <!--ABOUT HEADER-->
    <AboutHeader />

    <!--WHAT IS RAPPELTOUT-->
    <div class="pt-15">
        <StylizedTitle title="✦ QU'EST-CE QUE RAPPELTOUT ? ✦" />
    </div>

    <div
        class="w-full max-w-[1200px] mx-auto px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6"
    >
        <AboutCard1
            Icon={WandSparkles}
            title="Une application familiale gamifiée"
            text="Rappeltout est une application web gratuite conçue pour aider les familles, colocations et foyers partagés à s'organiser ensemble. Elle transforme les corvées du quotidien en quêtes à accomplir collectivement, avec un système de points et de niveaux."
        />

        <AboutCard1
            Icon={Shield}
            title="Inspirée de l'univers Harry Potter"
            text="Choisissez votre maison de Poudlard (Gryffondor, Serpentard, Serdaigle, Poufsouffle ou Parchemin), personnalisez votre profil avec un blason héraldique et montez des niveaux."
        />

        <div class="md:col-span-2">
            <AboutCard1
                Icon={Sparkles}
                title="Pourquoi Rappeltout ?"
                text="Gérer un foyer est souvent source de tensions : qui doit faire quoi, quand, et qui a oublié de racheter du pain ? Rappeltout centralise toute cette organisation dans une seule interface, visible et accessible par tous les membres. En ajoutant une couche de jeu et de progression, l'application rend cette gestion motivante plutôt que contraignante. Les enfants comme les adultes y trouvent un intérêt naturel à participer."
            />
        </div>
    </div>

    <!--FEATURES-->
    <div class="pt-15">
        <StylizedTitle title="✦ FONCTIONNALITÉS ✦" />
    </div>

    <div
        class="w-full max-w-[1200px] mx-auto px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6"
    >
        <AboutCard1
            Icon={ListTodo}
            title="Tâches ménagères partagées"
            text="Répartissez les corvées entre membres du foyer, définissez des responsables, des délais et des niveaux de difficulté avec points XP à la clé."
        />
        <AboutCard1
            Icon={Skull}
            title="Le Monstre du foyer"
            text="C'est le monstre que votre famille combat ensemble. Chaque tâche accomplie lui inflige des dégâts — vaincre le monstre débloque des butins collectifs."
        />
        <AboutCard1
            Icon={Star}
            title="Profil & progression"
            text="Chaque membre accumule des XP et monte des niveaux. Un vrai système de progression RPG pour rendre le quotidien motivant."
        />

        <AboutCard1
            Icon={Users}
            title="Gestion du foyer"
            text="Invitez vos proches via un code unique, gérez les rôles (Élève, Professeur·e et Directeur/Directrice) et visualisez l'activité de chaque membre en un coup d'œil."
        />
        <AboutCard1
            Icon={MessageCircle}
            title="Chat familial"
            text="Un espace de messagerie dédié à votre foyer pour se coordonner, s'encourager ou simplement échanger des nouvelles en dehors des applications tierces."
        />
        <AboutCard1
            Icon={Bell}
            title="Notifications intelligentes"
            text="Recevez des rappels pour vos tâches et soyez alerté des exploits de vos proches."
        />
        <AboutCard1
            Icon={ShoppingCart}
            title="Bientôt: Liste de courses partagée"
            text="Ajoutez des articles par catégorie, cochez-les en faisant vos courses et videz la liste d'un seul geste. N'oubliez plus jamais la bouteille de lait !"
            inprogress={true}
        />
        <AboutCard1
            Icon={Wallet}
            title="Bientôt: Budget familial"
            text="Suivez revenus et dépenses mois par mois, catégorisez vos transactions et visualisez le solde de votre foyer en temps réel."
            inprogress={true}
        />

        <AboutCard1
            Icon={Calendar}
            title="Bientôt: Calendrier familial"
            text="Centralisez rendez-vous, événements et rappels dans un calendrier partagé. Tout le foyer reste synchronisé sans effort."
            inprogress={true}
        />
    </div>

    <!--HOW IT WORKS-->
    <div class="pt-15">
        <StylizedTitle title="✦ COMMENT ÇA MARCHE ? ✦" />
    </div>

    <div class="w-full max-w-[1200px] mx-auto px-6 py-5 flex flex-col gap-6">
        <AboutCard2
            num="01"
            title="Créez votre foyer"
            text="Donnez un nom à votre foyer et générez un code d'invitation unique. Chaque membre le rejoindra depuis son propre compte."
        />
        <AboutCard2
            num="02"
            title="Personnalisez vos profils"
            text="Choisissez une photo, un titre, un blason héraldique et votre maison de Poudlard. Votre profil reflète votre progression dans le foyer."
        />
        <AboutCard2
            num="03"
            title="Ajoutez des tâches"
            text="Créez des tâches ménagères, assignez-les à un ou plusieurs membres, définissez une salle, une catégorie et des points XP."
        />
        <AboutCard2
            num="04"
            title="Accomplissez & progressez"
            text="Cochez vos tâches, infligez des dégâts à un monstre, accumulez de l'XP et débloquez des butins collectifs."
        />
    </div>

    <!--FOR WHO-->
    <div class="pt-15">
        <StylizedTitle title="✦ POUR QUI ? ✦" />
    </div>

    <div
        class="w-full max-w-[1200px] mx-auto px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6"
    >
        <AboutCard3
            src="/about/family_14.webp"
            title="Les familles"
            text="Impliquez enfants et parents dans la gestion du foyer avec un système de jeu qui motive même les plus réticents."
        />
        <AboutCard3
            src="/about/house_14.webp"
            title="Les colocations"
            text="Répartissez équitablement tâches et dépenses entre colocataires. Fini les tensions sur qui devait faire quoi."
        />
        <AboutCard3
            src="/about/solo_14.webp"
            title="Les solo"
            text="Gérez vos tâches personnelles, votre budget et vos rappels en solo — et invitez des proches quand vous le souhaitez."
        />
    </div>

    <!--QUESTIONS-->
    <div class="pt-15">
        <StylizedTitle title="✦ QUESTION FRÉQUENTES ✦" />
    </div>

    <div class="w-full max-w-[1200px] mx-auto px-6 py-5 flex flex-col gap-6">
        <AboutFAQ
            question="Rappeltout est-il gratuit ?"
            answer="Oui, Rappeltout est entièrement gratuit pour tous les membres d'un foyer. Aucun abonnement, aucune limitation cachée."
        />
        <AboutFAQ
            question="Mes données sont-elles sécurisées ?"
            answer="Vos données restent privées et liées à votre foyer. Seuls les membres invités y ont accès. Rappeltout ne partage aucune donnée avec des tiers."
        />
        <AboutFAQ
            question="Puis-je utiliser Rappeltout seul·e ?"
            answer="Absolument. Vous pouvez gérer vos tâches personnelles, votre budget et votre calendrier en solo, puis inviter des proches quand vous le souhaitez."
        />
        <AboutFAQ
            question="L'application fonctionne-t-elle sur mobile ?"
            answer="Rappeltout est une application web progressive responsive, accessible depuis n'importe quel navigateur sur smartphone, tablette ou ordinateur."
        />
    </div>

    <!--END CARD-->
    <div class="w-full max-w-[1200px] mx-auto px-6 py-8">
        <div
            class="bg-about-bg-header border-golden flex flex-col gap-4 items-center justify-center w-full px-6 py-8 border-settings-border rounded-2xl border-2 text-center"
        >
            <LogoVideo size={80} />
            <p class="text-white text-[40px]">
                Prêt·e à enchanter votre foyer ?
            </p>
            <p class="text-white text-[20px]">
                Rappeltout est gratuit. Commencez dès maintenant.
            </p>

            {#if data.isConnected}
                <a
                    href="/home"
                    class="text-[18px] bg-golden rounded-3xl py-4 px-8 flex flex-row gap-3 items-center justify-center hover:scale-105 transition-transform"
                >
                    <WandSparkles size={22} />
                    Accéder à l'application
                </a>
            {:else}
                <a
                    href="/auth/welcome"
                    class="text-[18px] bg-golden rounded-3xl py-4 px-8 flex flex-row gap-3 items-center justify-center hover:scale-105 transition-transform"
                >
                    <WandSparkles size={22} />
                    Accéder à l'application
                </a>
            {/if}
        </div>
    </div>

    <!--END-->
    <StylizedTitle title="" />

    <div
        class="flex justify-center items-center w-full max-w-[1200px] mx-auto px-6 py-8 font-justify text-center"
    >
        <p>
            <span class="font-bold">Rappeltout</span> Application web de gestion
            familiale gratuite. Organisez tâches ménagères, budget, liste de courses
            et calendrier en famille, avec un système de progression inspiré de l'univers
            Harry Potter.
        </p>
    </div>

    <AboutLink />
    <p class="flex justify-center">© 2026 Rappeltout</p>
</main>
