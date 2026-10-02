<script lang="ts">
    /**
     * @file AboutHeader.svelte
     * @brief About page header featuring the logo, the app name, a brief description of the app, and a button to join the app.
     */
    import { WandSparkles } from "@lucide/svelte";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
</script>

<div
    class="bg-about-bg-header h-200 flex flex-col items-center justify-center gap-6 px-6 text-center"
>
    <LogoVideo size={183} />
    <h1 class="text-[40px] md:text-[60px] text-white">Rappeltout</h1>

    <h2 class="text-[20px] md:text-[25px] text-golden">
        La magie de l'organisation familiale
    </h2>

    <p
        class="text-[18px] md:text-[22px] text-white w-full max-w-[800px] text-center font-[1]"
    >
        Rappeltout transforme la gestion du quotidien en aventure collective.
        Tâches, budget, courses et calendrier ! Tout est là, gamifié dans un
        univers inspiré de l'univers magique de Harry Potter.
    </p>

    <a
        href="/home"
        class="text-[18px] bg-golden rounded-3xl py-4 px-15 flex flex-row gap-3 hover:text-[19px]"
    >
        <WandSparkles size={22} />
        Commencer l'aventure >
    </a>
</div>
