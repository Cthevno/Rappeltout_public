<script lang="ts">
	import ButtonValidate from "$lib/components/auth/ButtonValidate.svelte";
	import ButtonConnected from "$lib/components/auth/ButtonConnected.svelte";
	import ButtonInfo from "$lib/components/auth/ButtonInfo.svelte";
	import ButtonReturn from "$lib/components/auth/ButtonReturn.svelte";
	import MsgError from "$lib/components/auth/MsgError.svelte";
	import AboutLink from "$lib/components/about/AboutLink.svelte";
	import { goto } from "$app/navigation";
	import { enhance } from "$app/forms";
	import LogoVideo from "$lib/components/LogoVideo.svelte";

	// Import the validation logic:
	import {
		validateEmail,
		isFormValid,
		type FormResponse,
	} from "../auth_validation";

	let pseudo: string = $state("");
	let email: string = $state("");
	let password: string = $state("");
	let password_confirm: string = $state("");

	let { form }: { form: FormResponse | null } = $props(); //response from +page.server.js (success or error)

	$effect(() => {
		if (form && form.success === true) {
			 if (form.requires2FA) goto("/auth/check");
            else goto("/home");
		}
	});

	let errorMsg = $derived(
		validateEmail({ pseudo, email, password, password_confirm }, form),
	);
	let isValid = $derived(
		isFormValid({ pseudo, email, password, password_confirm }),
	);
</script>

<main class="auth-page-base">
	<div class="flex-1 flex flex-col items-center justify-center gap-5">
		<LogoVideo size={183} />
		<h1 class="text-2xl font-normal">CRÉER UN COMPTE</h1>
		<p class="text-[15px]">Rejoignez la magie</p>

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
				text="Pseudo"
				option="username"
				t="text"
				bind:value={pseudo}
			/>
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
			<ButtonInfo
				text="Confirmation"
				option="password_confirm"
				t="password"
				bind:value={password_confirm}
			/>

			{#if form?.error}
				<p class="msg-auth-error">{form.error}</p>
			{:else}
				<MsgError text={errorMsg} />
			{/if}

			<ButtonValidate text="Rejoindre la magie" disabled={!isValid} />
		</form>

		<ButtonConnected url="/auth/emailConnexion" />

		<ButtonReturn url="/auth/welcome" />
	</div>

	<div class="mt-auto pt-8">
		<AboutLink />
	</div>
</main>
