<script lang="ts">
	import Header from "$lib/components/Header.svelte";
	import PersonalTask from "$lib/components/PersonalTask.svelte";
	import Form from "$lib/components/Form.svelte";
	import PendingDeleteAction from "$lib/components/PendingDeleteAction.svelte";
	import { Lock, Trash2, Plus, Send } from "@lucide/svelte";
	import { nameField, dateField } from "$lib/formFields";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	/**
	 * @file +page.svelte
	 * @brief Main view of the user's personal tasks.
	 * @details Displays the list of private tasks. A task can be created either via the
	 * full form (Form.svelte, opened from the "+" button in the Header), or via the
	 * quick-add field at the bottom of the list (name + optional date, submitted with Enter).
	 * The data is strictly personal.
	 * @see Header.svelte for the page header
	 * @see PersonalTask.svelte for the display structure of a task.
	 * @see Form.svelte for the full creation/edit form
	 * @see PendingDeleteAction.svelte for the deletion cancellation button
	 */

	/** Retrieves the tasks stored in the database and the errors reported by the form */
	let { data, form }: PageProps = $props();

	/** Shared with the parent to open or close the creation form (true = form visible, false = form closed). */
	let newTaskOpen: boolean = $state(false);

	/** Task currently being edited (undefined = creation mode). Passed to Form to pre-fill and choose the action. */
	let editingTask: (typeof data.tasks)[number] | undefined =
		$state(undefined);

	/** Resets editingTask to undefined as soon as the form closes, whatever the closing path (Cancel, cross, "+"). */
	$effect(() => {
		if (!newTaskOpen) editingTask = undefined;
	});

	/** Opens the form in edit mode for the given task. */
	function openEdit(task: (typeof data.tasks)[number]) {
		editingTask = task;
		newTaskOpen = true;
	}

	type Task = {
		id: number;
		createdAt: Date;
		userId: number;
		endedAt: Date | null;
		finishedAt: Date | null;
		nameTask: string;
		isFinish: boolean;
		overdueNotifiedAt: Date | null;
	};

	/**
	 * @brief Formats the information coming out of prisma
	 * @param task (Task) The task
	 * @returns Returns an object with formatted dates, ready for PersonalTask
	 */
	function formatting(task: Task) {
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		const isOverdue =
			!task.isFinish &&
			task.endedAt !== null &&
			new Date(task.endedAt) < today;

		return {
			id: task.id,
			name: task.nameTask,
			isFinish: task.isFinish,
			isOverdue,
			limit_date: task.endedAt?.toLocaleDateString("fr-FR"),
			finished_date: task.finishedAt?.toLocaleDateString("fr-FR"),
		};
	}

	/**Used to store the id of the task to delete, or undefined if there is no task to delete*/
	let PendingDeleteId: number | undefined = $state(undefined);

	/** Reference to the hidden deletion form, to submit it programmatically (timer, cross-cancellation in RequestDelete). */
	let deleteForm: HTMLFormElement | undefined = $state();

	/**
	 * @brief Sets the task pending deletion, and if another task is already pending,
	 * immediately triggers its deletion before replacing it
	 * @param id (number) the id of the task to delete
	 * @note If there is a task to delete and this task is not the new task to delete,
	 * 	deletes the task to delete, otherwise stores the id of the new task to delete
	 */
	function RequestDelete(id: number) {
		if (PendingDeleteId !== undefined && PendingDeleteId !== id)
			deleteForm?.requestSubmit();
		PendingDeleteId = id;
	}

	/**Used to know whether there are completed tasks to delete*/
	let PendingDeleteChecked: boolean = $state(false);

	/** Reference to the hidden bulk deletion form, to submit it programmatically (timer). */
	let deleteCheckedForm: HTMLFormElement | undefined = $state();

	/** Reference to the quick-add input field, to refocus it after each addition. */
	let quickAddInput: HTMLInputElement | undefined = $state();

	/** Current value of the quick-add field. */
	let quickAddValue: string = $state("");

	/** Minimum rule: no submission if the name is empty after trimming. */
	let isQuickAddValid = $derived(quickAddValue.trim().length > 0 && quickAddValue.trim().length <= 500);

	let isTooLong = $derived(quickAddValue.trim().length <= 500);
</script>

<main class="m-0 min-h-screen bg-background font-serif">
	<Header
		url="/home"
		text="Accueil"
		title="Mes tâches perso"
		Icon={Lock}
		right="task"
		bind:newTaskOpen
		notifications={data.notifications}
		unread_count={data.unreadCount}
	/>

	<div
		class="flex flex-row justify-center bg-beige border border-grey border-dashed rounded-xl mx-4 md:mx-40 my-5 p-5 items-center text-grey"
	>
		<Lock
			class="p-[2px] md:p-[5px] w-[5em] h-[5em] md:w-[3em] md:h-[3em]"
		/>
		<p class="ml-5 text-justify">
			Espace privé — visible par toi seul(e), sous sortilège de Fidelitas.
			L'XP gagné compte pour ton rang, pas pour le monstre du foyer.
		</p>
	</div>

	<div class="mx-4 md:mx-40 flex flex-row items-center gap-2">
		{#if data.tasks.some((task) => task.isFinish)}
			<div class="ml-auto">
				<button
					type="button"
					onclick={() => {
						PendingDeleteChecked = true;
					}}
					class="flex flex-row items-center gap-2 border border-grey rounded-xl py-2 px-3 text-black bg-beige hover:bg-red hover:text-white hover:border-red transition-colors"
				>
					<Trash2 class="w-[1.1em] h-[1.1em]" />
					Supprimer les tâches accomplies
				</button>
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-3 my-5">
		{#each data.tasks as task}
			<PersonalTask
				task={formatting(task)}
				onEdit={() => openEdit(task)}
				onDelete={RequestDelete}
				isPendingCancel={task.id === PendingDeleteId ||
					(PendingDeleteChecked && task.isFinish)}
				todo={true}
			/>
		{/each}

		<form
			method="POST"
			action="?/create"
			class="mx-4 md:mx-40 flex flex-col gap-1 border border-grey rounded-xl p-2 bg-beige transition-colors focus-within:border-black"
			use:enhance={() => {
				return async ({ update }) => {
					await update({ reset: true });
					quickAddValue = "";
					quickAddInput?.focus();
				};
			}}
		>
			<div class="flex flex-row flex-wrap items-center gap-2">
				<button type="button" onclick={() => (newTaskOpen = true)}>
					<Plus class="w-[1.1em] h-[1.1em] text-grey shrink-0" />
				</button>
				<input
					type="text"
					name="task"
					placeholder="Nouvelle tâche…"
					bind:this={quickAddInput}
					bind:value={quickAddValue}
					class="flex-1 bg-transparent outline-none min-w-0 placeholder:text-grey"
				/>

				<input
					type="date"
					name="date"
					class="w-full hidden sm:flex sm:w-auto bg-transparent outline-none text-grey cursor-pointer"
				/>

				<button
					type="submit"
					aria-label="Ajouter la tâche"
					disabled={!isQuickAddValid}
					class="shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<Send class="w-[1.1em] h-[1.1em]" />
				</button>
			</div>
			{#if form?.error}
				<p class="text-red">{form.error}</p>
			{:else if !isTooLong}
				<p class="text-red">La tâche ne peut pas faire plus de 500 caractères.</p>
			{/if}
		</form>
	</div>

	<p class="mx-4 md:mx-40 text-grey text-center">
		« Même les plus grands sorciers tiennent leur carnet secret. »
	</p>

	{#if newTaskOpen}
		<Form
			bind:newTaskOpen
			{form}
			task={editingTask}
			fields={[nameField(editingTask), dateField(editingTask)]}
		/>
	{/if}

	<PendingDeleteAction
		bind:formRef={deleteForm}
		bind:pending={PendingDeleteId}
		resetValue={undefined}
		action="?/delete"
		hasPendingDelete={PendingDeleteId !== undefined}
	/>

	<PendingDeleteAction
		bind:formRef={deleteCheckedForm}
		bind:pending={PendingDeleteChecked}
		resetValue={false}
		action="?/deleteChecked"
		hasPendingDelete={PendingDeleteChecked}
	/>
</main>
