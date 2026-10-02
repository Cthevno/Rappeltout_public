<script lang="ts">
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
</script>

<main class="auth-page-base px-4">
    <div class="flex-1 flex flex-col items-center justify-center gap-5">
        <LogoVideo size={354} />
        <h1 class="text-[20px] text-center">Votre aventure commence ici</h1>

        <a
            href="/auth/welcome"
            class="
            hover:bg-btn-hover transition-colors cursor-pointer
            btn-auth
            bg-[#EBCF9B]
            text-black no-underline
            btn-auth-center
            btn-auth-police
            btn-auth-border"
        >
            Entrer dans le Royaume
        </a>
    </div>

    <div class="pt-4">
        <AboutLink />
    </div>
</main>
