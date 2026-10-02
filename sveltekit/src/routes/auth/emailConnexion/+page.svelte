<script lang="ts">
    import ButtonValidate from "$lib/components/auth/ButtonValidate.svelte";
    import ButtonCreateAccount from "$lib/components/auth/ButtonCreateAccount.svelte";
    import ButtonInfo from "$lib/components/auth/ButtonInfo.svelte";
    import ButtonReturn from "$lib/components/auth/ButtonReturn.svelte";
    import ButtonForgotPassword from "$lib/components/auth/ButtonForgotPassword.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import MsgError from "$lib/components/auth/MsgError.svelte";
    import { goto } from "$app/navigation";
    import { enhance } from "$app/forms";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
    import { emailConnexionTest, isEmailConnexionFormValid } from "../auth_validation";


    interface FormResponse {
        success?: boolean;
        error?: string;
        requires2FA?: boolean;
    }

    let email: string = $state("");
    let password: string = $state("");

    let { form }: { form: FormResponse | null } = $props(); //response from +page.server.js (success or error)

    $effect(() => {
        if (form && form.success === true) {
            if (form.requires2FA) goto("/auth/check");
            else goto("/home");
        }
    });

    let errorMsg = $derived( emailConnexionTest(email, password));

</script>

<main class="auth-page-base">
    <div class="flex-1 flex flex-col items-center justify-center gap-5">
        <LogoVideo size={183} />
        <h1 class="text-2xl font-normal">CONNEXION</h1>
        <p class="text-[15px]">Accédez à votre magie</p>

        <form
            method="POST"
            use:enhance={() => {
                return async ({ update }) => {
                    await update({ reset: false });
                };
            }}
            class="flex flex-col items-center gap-5"
        >
            <ButtonInfo
                text="Email"
                option="email"
                t="text"
                bind:value={email}
            />
            <ButtonInfo
                text="Mot de passe"
                option="password"
                t="password"
                bind:value={password}
            />
            <ButtonForgotPassword url="/auth/forgot" />
            <ButtonValidate text="Se connecter" disabled={!isEmailConnexionFormValid(email, password)} />

            {#if form?.error}
                <p class="msg-auth-error">{form.error}</p>
            {:else}
            <MsgError text={errorMsg} />
            {/if}
        </form>

        <ButtonCreateAccount url="/auth/create" />
        <ButtonReturn url="/auth/welcome" />
    </div>

    <div class="mt-auto pt-8">
        <AboutLink />
    </div>
</main>
