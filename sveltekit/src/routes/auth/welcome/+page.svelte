<script lang="ts">
    import ButtonRedirect from "$lib/components/auth/ButtonRedirect.svelte";
    import ButtonCreateAccount from "$lib/components/auth/ButtonCreateAccount.svelte";
    import ButtonReturn from "$lib/components/auth/ButtonReturn.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
    import { page } from "$app/state";
    import { Mail } from "@lucide/svelte";
    import MsgError from "$lib/components/auth/MsgError.svelte";

    const error = $derived(page.url.searchParams.get("error"));
</script>

<main class="auth-page-base">
    <div class="flex-1 flex flex-col items-center justify-center gap-5 w-full max-w-[300px]">
        <LogoVideo size={183} />
        <h1 class="text-2xl font-normal">Bienvenue Magicien</h1>
        <p class="text-[16px]">Choisissez votre mode de connexion</p>

        <form
            method="POST"
            action="/auth/google"
            class="w-full flex justify-center"
        >
            <button
                class="btn-auth btn-auth-police btn-auth-hover btn-auth-center btn-auth-border gap-2 w-full justify-center"
                type="submit">Continuer avec Google</button
            >
        </form>

        {#if error === "google_failed" || error === "config_error"}
            <MsgError
                text=" Erreur lors de la connexion avec Google. Veuillez réessayer."
            />
        {/if}

        <ButtonRedirect
            text="Connexion Email"
            url="/auth/emailConnexion"
            icon={Mail}
        />

        <p class="text-[15px]">Vous n’avez pas de compte ?</p>

        <ButtonCreateAccount url="/auth/create" />

        <ButtonReturn url="/" />
    </div>

    <div class="mt-auto pt-8">
        <AboutLink />
    </div>
</main>
