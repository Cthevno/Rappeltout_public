<script lang="ts">
    import ButtonValidate from "$lib/components/auth/ButtonValidate.svelte";
    import ButtonInfo from "$lib/components/auth/ButtonInfo.svelte";
    import ButtonReturn from "$lib/components/auth/ButtonReturn.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
    import MsgError from "$lib/components/auth/MsgError.svelte";
    import { goto } from "$app/navigation";
    import { enhance } from "$app/forms";
    import { isCodeAuthValid, isCodeFormValid } from "../auth_validation";

    /**
     * @brief Verification page for 2FA security flow.
     * * This page prompts the user to enter the security code received via email.
     * It handles form submission, server-side validation responses, and
     * automatic navigation to the home page upon success.
     * * @param form  (Object) The object returned by the server action containing 'success' and 'error' states.
     */

    interface FormResponse {
        success?: boolean;
        error?: string;
    }

    let code: string = $state("");

    let { form }: { form: FormResponse | null } = $props(); //response from +page.server.js (success or error)

    $effect(() => {
        if (form && form.success === true) {
            goto("/home");
        }
    });

    let errorMsg = $derived(isCodeAuthValid(code));

</script>

<main class="auth-page-base">
    <div class="flex-1 flex flex-col items-center justify-center gap-5">
        <LogoVideo size={183} />
        <h1 class="text-2xl font-normal">Vérification</h1>

        <form
            method="POST"
            use:enhance
            class="flex flex-col items-center gap-5"
        >
            <ButtonInfo text="Code" option="code" t="text" bind:value={code} />
            <ButtonValidate text="Se connecter" disabled={!isCodeFormValid(code)} />

            {#if form?.error}
                <p class="msg-auth-error">{form.error}</p>
            {:else}
                <MsgError text={errorMsg} />
            {/if}
        </form>

        <ButtonReturn url="/auth/welcome" />
        
    </div>

    <div class="mt-auto pt-8">
        <AboutLink />
    </div>
</main>
