<script lang="ts">
	/**
	 * @file PersonalTask.svelte
	 * @brief Card displaying a personal task.
	 * @details Displays the name, category, deadline and XP associated with a task.
	 * An optional assignee can be displayed for shared tasks.
	 * @param task ({ id: number, name: string, label: string, limit_date?: string, xp: string, isFinish: boolean, finished_date?: string, assignees?: { id: number, username: string }[] }) Object representing the task to display.
	 * @param [todo] (boolean) true if the task comes from the todo page (hides the XP badge, not relevant for a personal task).
	 * @param onEdit (() => void) Called when the edit button is clicked.
	 * @param onDelete ((id: number) => void) Called when the delete button is clicked, with the task's id.
	 * @param isPendingCancel (boolean) true to hide the card while a deletion is pending cancellation.
	 * @param onSuccess (function) Function called after a successful check/uncheck of the task.
	 * @param [canValidate] (boolean) Whether the task can be checked or unchecked.
	 * @param [onValidationDenied] (() => void) Called when validation is not allowed.
	 */

	import { SquareCheck, Square, Pencil, Trash2 } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import AvatarInitials from "$lib/components/manage_house/AvatarInitials.svelte";

	let {
		task,
		todo,
		onEdit,
		onDelete,
		isPendingCancel,
		onSuccess,
		canValidate = true,
		onValidationDenied,
	}: {
		task: {
			id: number;
			name: string;
			label?: string;
			limit_date?: string;
			xp?: string;
			isFinish: boolean;
			isOverdue?: boolean;
			finished_date?: string;
			assignees?: { id: number; username: string }[];
		};
		todo?: boolean;
		onEdit: () => void;
		onDelete: (id: number) => void;
		isPendingCancel: boolean;
		onSuccess?: () => void;
		canValidate?: boolean;
		onValidationDenied?: () => void;
	} = $props();

	let checkBtn: HTMLButtonElement;

	/**
	 * @brief Converts a task difficulty enum value into its base XP amount.
	 *
	 * @param enum_string (string) The difficulty enum value ("SUPER_EASY", "EASY", "MEDIUM", "DIFFICULT").
	 *
	 * @returns (number) The base XP granted for that difficulty, or 0 if the value is unrecognized.
	 */
	function enum_to_xp(enum_string: string): number {
		if (enum_string === "SUPER_EASY") return 5;
		else if (enum_string === "EASY") return 10;
		else if (enum_string === "MEDIUM") return 15;
		else if (enum_string === "DIFFICULT") return 20;
		return 0;
	}

	/**
	 * @brief Builds the XP label to display for the current task.
	 * @details The base XP (from the task's difficulty) is multiplied by the number of
	 * assignees when the task has more than one, since each assignee earns the full
	 * amount individually.
	 *
	 * @returns (string) The formatted XP label (e.g. "+ 20 xp"), or an empty string if
	 * the task has no difficulty set.
	 */
	function displayXp(): string {
		if (!task.xp) return "";
		const baseXp = enum_to_xp(task.xp);
		const multiplier =
			task.assignees && task.assignees.length > 1
				? task.assignees.length
				: 1;
		return `+ ${baseXp * multiplier} xp`;
	}
</script>

<form
	method="POST"
	use:enhance={() => {
		return async ({ result, update }) => {
			await update();
			if (result.type === "success") onSuccess?.();
		};
	}}
>
	<input type="hidden" name="id" value={task.id} />
	<input type="hidden" name="isFinish" value={task.isFinish} />
	<button
		type="submit"
		formaction="?/check"
		aria-label={task.isFinish
			? "Décocher la tâche"
			: "Marquer comme terminé"}
		bind:this={checkBtn}
		class="hidden"
	></button>
	<div
		class="mx-4 md:mx-40 p-2 border rounded-xl flex flex-row items-center
	{task.isOverdue && !task.isFinish
			? 'border-red bg-red/10'
			: 'border-grey bg-beige'}
	{task.isFinish ? 'opacity-50' : ''}
	{isPendingCancel ? 'hidden' : ''}"
		role="button"
		tabindex="0"
		onclick={() => {
			if (canValidate) {
				checkBtn.click();
			} else {
				onValidationDenied?.();
			}
		}}
		onkeydown={(e) => {
			if (e.target !== e.currentTarget) return;
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();

				if (canValidate) {
					checkBtn.click();
				} else {
					onValidationDenied?.();
				}
			}
		}}
	>
		<div class="m-2 p-2 rounded-xl">
			{#if task.isFinish}
				<SquareCheck color="green" />
			{:else}
				<Square />
			{/if}
		</div>
		<div
			class="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between sm:items-center"
		>
			<div class="mx-4 min-w-0 break-words">
				<p class={task.isFinish ? "line-through" : ""}>
					{task.name}
				</p>
				<p
					class={task.isFinish
						? "text-green"
						: task.isOverdue
							? "text-red"
							: "text-grey"}
				>
					{#if task.isFinish}
						Accomplie{task.finished_date
							? ` le ${task.finished_date}`
							: ""}
						{#if !todo}
							{#if task.xp}
								({displayXp()})
							{/if}
						{/if}
					{:else if task.limit_date}
						{#if task.label}
							{task.label} - {task.limit_date}
						{:else}
							Date limite: {task.limit_date}
						{/if}
					{:else}
						{task.label}
					{/if}
				</p>
			</div>
			<div class="ml-auto flex flex-col items-end gap-2">
				{#if task.assignees && task.assignees.length > 0}
					<div
						class="flex flex-row shrink-0 items-center justify-end gap-1"
					>
						{#each task.assignees as assignee (assignee.id)}
							<AvatarInitials username={assignee.username} />
						{/each}
					</div>
				{/if}
				<div class="flex flex-row items-center gap-2">
					{#if task.xp}
						<div
							class="whitespace-nowrap p-2 border rounded-full border-grey bg-background-xp text-black {task.isFinish
								? 'hidden'
								: ''}"
						>
							{displayXp()}
						</div>
					{/if}
					<button
						type="button"
						aria-label="Modifier la tâche"
						onclick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						class="p-2 border rounded-full border-grey text-black hover:bg-red hover:text-white"
					>
						<Pencil />
					</button>
					<button
						type="button"
						aria-label="Supprimer la tâche"
						onclick={(e) => {
							e.stopPropagation();
							onDelete(task.id);
						}}
						class="p-2 border rounded-full border-grey text-black hover:bg-red hover:text-white"
					>
						<Trash2 />
					</button>
				</div>
			</div>
		</div>
	</div>
</form>
