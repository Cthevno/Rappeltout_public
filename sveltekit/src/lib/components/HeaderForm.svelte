<script lang="ts">
	/**
	 * @file HeaderForm.svelte
	 * @brief Header of the new task creation form.
	 * @details Displays the "Nouvelle tâche" title with a WandSparkles icon and an X button to close the form.
	 * @param [newTaskOpen] (boolean) Shared with the parent to close the form (false = form closed).
	 * @param isEditing (boolean) true if the form is editing an existing task, false when creating.
	 */

	import { WandSparkles, X } from "@lucide/svelte";

	let {
		newTaskOpen = $bindable(false),
		isEditing,
	}: {
		newTaskOpen?: boolean;
		isEditing: boolean;
	} = $props();
</script>

<div
	class="flex flex-row items-center justify-between bg-background-header p-4 rounded-t-xl"
>
	<div class="flex flex-row items-center gap-2">
		<WandSparkles
			color="black"
			class="p-[3px] bg-background-icon rounded-md"
		/>
		<p class="text-white"> {isEditing ? "Editer la tâche" : "Nouvelle tâche"}</p>
	</div>
	<X color="white" onclick={() => (newTaskOpen = false)} />
</div>
