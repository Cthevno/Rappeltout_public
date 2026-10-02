<script lang="ts">
	import HeaderForm from "./HeaderForm.svelte";
	import FormField from "./FormField.svelte";
	import { Astroid } from "@lucide/svelte";
	import { enhance } from "$app/forms";

	/**
	 * @file Form.svelte
	 * @brief Form for creating/editing a task (personal todo or household task).
	 * @details Displays one field per entry of `fields` (via FormField.svelte). Submits to
	 * the `?/edit` action if `task` is provided (edit mode), otherwise to `?/create`.
	 * @param [newTaskOpen] (boolean) Shared with the parent to open or close the form.
	 * @param form (object) Errors reported by the previous form action (form?.error).
	 * @param [task] (object) Task to edit; undefined = creation mode. Must carry at least `id`.
	 * @param fields (object[]) List of fields to display, produced by lib/formFields.ts.
	 * @param [onSuccess] (function) Function called after a successful form submission (creation or edit).
	 */
	let {
		newTaskOpen = $bindable(false),
		form,
		task,
		fields,
		onSuccess,
	}: {
		newTaskOpen: boolean;
		form: { error?: string } | null | undefined;
		task?: { id: number };
		fields: (
			| {
					label: string;
					type: "text";
					name: string;
					placeholder?: string;
					value?: string;
			  }
			| { label: string; type: "date"; name: string; value?: string }
			| {
					label: string;
					type: "filter";
					name: string;
					filters: {
						label: string;
						stateDefault: boolean;
						sublabel?: string;
					}[];
					multiple?: boolean;
			  }
		)[];
		onSuccess?: () => void;
	} = $props();
	const isEditing = $derived(!!task);
	/** Current value of each field (same index as `fields`), pre-filled from field.value. */
	let fieldValues: string[] = $state(
        (() => fields.map((f) => ("value" in f ? (f.value ?? "") : "")))()
    );
	/** Index of the "task name" field (the only required text field). */
	let nameFieldIndex = $derived(fields.findIndex((f) => f.type === "text"));

	/** Minimum rule: the task name must not be empty after trimming. */
	let isValid = $derived(
		nameFieldIndex === -1 || (fieldValues[nameFieldIndex].trim().length > 0 && fieldValues[nameFieldIndex].trim().length <= 500),
	);

	let isTooLong = $derived(fieldValues[nameFieldIndex].trim().length <= 500);

</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
	<button
		class="fixed inset-0 cursor-default bg-black/50"
		aria-label="Fermer le formulaire"
		onclick={() => (newTaskOpen = false)}
	></button>
	<div
		class="relative border rounded-xl border-yellow bg-beige w-full max-w-lg max-h-full flex flex-col overflow-hidden"
	>
		<div class="sticky top-0 bg-beige z-10">
			<HeaderForm bind:newTaskOpen {isEditing} />
		</div>

		<div class="p-4 overflow-y-auto">
			<form
				method="POST"
				class="space-y-5"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === "success") {
							newTaskOpen = false;
							onSuccess?.();
						}
						await update();
					};
				}}
			>
				{#if task}<input type="hidden" name="id" value={task.id} />{/if}
				{#each fields as field, i}
					<FormField
						{...field}
						onValueInput={(v) => (fieldValues[i] = v)}
					/>
				{/each}
				{#if form?.error}
					<p class="text-red text-center">{form.error}</p>
				{:else if !isTooLong}
					<p class="text-red">La tâche ne peut pas faire plus de 500 caractères.</p>
				{/if}
				<div class="flex flex-row justify-center gap-2 sm:gap-5 m-2">
					<button
						type="button"
						class="border border-background-icon py-2 px-3 sm:py-4 sm:px-6 rounded-xl text-grey"
						onclick={() => (newTaskOpen = false)}
					>
						Annuler
					</button>
					<button
						type="submit"
						formaction={isEditing ? "?/edit" : "?/create"}
						disabled={!isValid}
						class="flex flex-row border border-background-icon py-2 px-3 sm:py-4 sm:px-6 rounded-xl text-white bg-red disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Astroid class="p-[3px] mx-1" />{isEditing
							? "Modifier"
							: "Ajouter"}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
