<script lang="ts">
    import ButtonInfo from "$lib/components/auth/ButtonInfo.svelte";
    import ButtonReturn from "$lib/components/auth/ButtonReturn.svelte";
    import ButtonValidate from "$lib/components/auth/ButtonValidate.svelte";
    import { enhance } from "$app/forms";
    import MsgError from "$lib/components/auth/MsgError.svelte";
    import AboutLink from "$lib/components/about/AboutLink.svelte";
    import LogoVideo from "$lib/components/LogoVideo.svelte";
    import { forgotTest, isForgotFormValid } from "../auth_validation";

    interface FormResponse {
        success?: boolean;
        error?: string;
        msg?: string;
    }

    let { form } : { form: FormResponse | null } = $props();

    let email: string = $state("");

    let errorMsg = $derived(forgotTest(email));
</script>

<main class="auth-page-base">
    <div class="flex-1 flex flex-col items-center justify-center gap-5">
        <LogoVideo size={183} />
        <h1 class="text-2xl font-normal">MOT DE PASSE OUBLIÉ</h1>

        <form
            method="POST"
            use:enhance
            class="flex flex-col items-center gap-5"
        >
            <ButtonInfo
                text="Email"
                option="email"
                t="text"
                bind:value={email}
            />
            {#if form?.success}
                <p class="text-[#176318] text-center">{form.msg}</p>
            {:else if form?.error}
                <p class="msg-auth-error">{form.error}</p>
            {:else}
                <MsgError text={errorMsg} />
            {/if}

            <ButtonValidate text="Envoyer le lien" disabled={!isForgotFormValid(email)}/>
        </form>

        <ButtonReturn url="/auth/welcome" />
    </div>

    <div class="mt-auto pt-8">
        <AboutLink />
    </div>
</main>
