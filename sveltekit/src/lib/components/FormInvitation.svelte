<script lang="ts">
	/**
	 * @file FormInvitation.svelte
	 * @brief Modal form used to send a house invitation by email.
	 * @param [open_form=false] (boolean) Controls whether the modal is displayed (bindable).
	 * @param formaction (string) Form action used to submit the invitation.
	 * @param [form=null] ({ error?: string } | null) Form result, used to display a submission error.
	 * @param [onSuccess] (() => void) Called after a successful submission.
	 */

	import { UserPlus, X } from "@lucide/svelte";
	import ButtonValidate2 from "./ButtonValidate2.svelte";
	import { enhance } from "$app/forms";
	import { isEmailFormatValid } from "../../routes/auth/auth_validation";

	let {
		open_form = $bindable(false),
		formaction,
		form,
		onSuccess,
	}: {
		open_form: boolean;
		formaction: string;
		form?: unknown;
		onSuccess?: () => void;
	} = $props();

	const formError = $derived(
		(form as { error?: string } | null | undefined)?.error,
	);

	let email = $state("");

	let emailError = $derived.by(() => {
		if (email === "") return null;
		if (!isEmailFormatValid(email)) return "Format de l'email non valide";
		if (email.length > 100) return "Email trop long !";
		return null;
	});

	let isEmailValid = $derived(
		email !== "" && isEmailFormatValid(email) && email.length <= 100,
	);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
	<div
		class="fixed inset-0 cursor-default bg-black/50"
		onclick={() => (open_form = false)}
		role="presentation"
	></div>
	<div
		class="relative border rounded-xl border-yellow bg-beige w-full max-w-lg max-h-full flex flex-col overflow-hidden"
	>
		<div class="sticky top-0 bg-beige z-10">
			<div
				class="flex flex-row items-center justify-between bg-background-header p-4 rounded-t-xl"
			>
				<div class="flex flex-row items-center gap-2">
					<UserPlus
						color="black"
						class="p-[3px] bg-background-icon rounded-md"
					/>
					<p class="text-white">Envoyer une invitation</p>
				</div>
				<X color="white" onclick={() => (open_form = false)} />
			</div>
		</div>

		<div class="p-4 overflow-y-auto">
			<p class="text-left py-1">
				Veuillez entrer le mail de la personne à inviter :
			</p>
			<form
				method="POST"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === "success") {
							open_form = false;
							onSuccess?.();
						}
						await update();
					};
				}}
				class="space-y-5 mt-4"
			>
				<input
					class="text-grey border rounded-xl border-background-icon w-full px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red focus:border-red"
					type="email"
					name="email"
					required
					bind:value={email}
				/>
				<div class="flex flex-row justify-center gap-2 sm:gap-5 m-2">
					<button
						type="button"
						class="border border-background-icon py-2 px-3 sm:py-4 sm:px-6 rounded-xl text-grey"
						onclick={() => (open_form = false)}
					>
						Annuler
					</button>
					<ButtonValidate2
						text="Confirmer"
						{formaction}
						disabled={!isEmailValid}
					/>
				</div>
				{#if formError}
					<p class="text-red text-center">{formError}</p>
				{:else if emailError}
					<p class="text-red text-center">{emailError}</p>
				{/if}
			</form>
		</div>
	</div>
</div>
