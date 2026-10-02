<script lang="ts">
    /**
     * @file +page.svelte
     * @brief Creator's landing page right after creating a household.
     * @details Displays the newly created household's invitation code as well as a list of suggested
     * steps (inviting members, adding tasks, discovering the household) to get started.
     */
    import SimpleHeader from "$lib/components/SimpleHeader.svelte";
    import ButtonRedirect from "$lib/components/auth/ButtonRedirect.svelte";
    import ButtonHorizontalRedirect from "$lib/components/ButtonHorizontalRedirect.svelte";
    import { Send, UsersRound, WandSparkles } from "@lucide/svelte";
    import type { Component } from "svelte";
    import type { PageProps } from "./$types";
    let { data }: PageProps = $props();

    const startingSteps: {
        title: string;
        subtitle: string;
        Icon: Component;
        url: string;
    }[] = [
        {
            title: "Inviter les membres",
            subtitle:
                "Partage le code d'invitation pour que ta famille rejoigne le foyer",
            Icon: Send,
            url: "/manage_house",
        },
        {
            title: "Ajouter des tâches",
            subtitle:
                "Crée les premières tâches ménagères pour faire travailler le foyer",
            Icon: WandSparkles,
            url: "/household_chores",
        },
        {
            title: "Découvrir le foyer",
            subtitle:
                "Explore les membres, les rôles et les statistiques du foyer",
            Icon: UsersRound,
            url: "/house",
        },
    ];
</script>

<main class="min-h-screen bg-background font-sans">
    <SimpleHeader code={data.code} notifications={data.notifications} unread_count={data.unreadCount}
 />
    <div
        class="flex flex-col items-center justify-center gap-4 text-center font-serif px-4 py-10"
    >
        <h1 class="text-3xl font-bold">Bienvenue, {data.username} !</h1>
        <p class="text-text-form text-lg">
            Le foyer <span class="font-bold text-black">{data.houseName}</span>
            vient d'être fondé.<br />
            Voici comment le mettre en vie ✨
        </p>

        <div
            class="border-2 border-settings-border bg-settings-bg-card rounded-xl px-8 py-6 flex flex-col items-center gap-2 mt-4"
        >
            <p class="font-bold text-text-form">Ton code d'invitation</p>
            <p class="text-2xl font-bold tracking-widest">{data.code}</p>
            <p class="text-sm text-text-form">
                Partage-le à ta famille pour qu'ils rejoignent le foyer
            </p>
        </div>
        <div class="py-5">
            <p class="font-bold text-text-form text-xl">✦ Par où commencer ✦</p>
            {#each startingSteps as step}
                <ButtonHorizontalRedirect
                    title={step.title}
                    subtitle={step.subtitle}
                    Icon={step.Icon}
                    url={step.url}
                />
            {/each}
        </div>
        <ButtonRedirect
            text="Accéder à l'accueil complet"
            url="/home"
            style="bg-background-red hover:bg-background-red/80 text-white max-w-[300px]"
        />
    </div>
</main>
