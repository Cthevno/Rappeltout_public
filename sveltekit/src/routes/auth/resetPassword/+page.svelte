<script lang="ts">
    import ButtonInfo from "$lib/components/auth/ButtonInfo.svelte";
    import ButtonReturn from "$lib/components/auth/ButtonReturn.svelte";
    import ButtonValidate from "$lib/components/auth/ButtonValidate.svelte";
    import MsgError from "$lib/components/auth/MsgError.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
    import { resetPasswordTest, isResetPasswordFormValid} from "../auth_validation";
    import { enhance } from "$app/forms";

    let { data, form } = $props();

    let password: string = $state("");
    let password_confirm: string = $state("");

    let errorMsg = $derived(resetPasswordTest(password, password_confirm));
</script>

<main class="auth-page-base">
    <div class="flex-1 flex flex-col items-center justify-center gap-5">
        <LogoVideo size={183} />
        <h1 class="text-2xl font-normal">MOT DE PASSE OUBLIÉ</h1>

        {#if data.token}
            <form
                method="POST"
                use:enhance
                class="flex flex-col items-center gap-5"
            >
                <ButtonInfo
                    text="Nouveau mot de passe"
                    option="password"
                    t="password"
                    bind:value={password}
                />
                <input type="hidden" name="token" value={data.token} />
                <ButtonInfo
                    text="Confirmation"
                    option="password_confirm"
                    t="password"
                    bind:value={password_confirm}
                />
                <ButtonValidate text="Valider" disabled={!isResetPasswordFormValid(password, password_confirm)}/>
            </form>
        {:else}
            <MsgError text={data.error} />
            <a href="/auth/forgot" class="text-sm underline mt-2"
                >Demander un nouveau lien</a
            >
        {/if}

        {#if form?.error}
            <p class="msg-auth-error">{form.error}</p>
        {:else}
            <MsgError text={errorMsg} />
        {/if}

        <ButtonReturn url="/auth/welcome" />
    </div>

    <div class="mt-auto pt-8">
        <AboutLink />
    </div>
</main>
