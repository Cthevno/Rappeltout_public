<script lang="ts">
	/**
	 * @file NewTask.svelte
	 * @brief Button that opens the new task creation form.
	 * @param stateDefault (boolean) Initial state of the button (true = form open by default).
	 * @param [open] (boolean) Shared with the parent to open or close the form.
	 */

	import { Plus } from "@lucide/svelte";

	let {
		stateDefault,
		open = $bindable(stateDefault),
	}: { stateDefault: boolean; open?: boolean } = $props();
</script>

<button
	onclick={() => (open = !open)}
	class="flex flex-row items-center justify-center m-5 bg-background-red rounded-xl"
>
	<Plus color="#fff" class="p-[15px] w-[3em] h-[3em]" />
	<p class="hidden sm:flex pr-4 text-white">Nouvelle tâche</p>
</button>
