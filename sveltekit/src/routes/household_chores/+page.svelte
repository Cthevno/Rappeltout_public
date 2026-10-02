<script lang="ts">
	/**
	 * @file +page.svelte
	 * @brief Main view of the household's shared tasks.
	 * @details Displays the list of the household's shared tasks with the household's name and today's date,
	 * and a task creation/edit form (Form.svelte). Unlike personal tasks,
	 * each task can be assigned to one or more members, displayed as avatar initials.
	 * @see PersonalTask.svelte for the display structure of a task.
	 * @see FormField.svelte for the different types of form fields.
	 * @see FilterMenu.svelte for the display of filters.
	 */
	// Import
	import Header from "$lib/components/Header.svelte";
	import FilterMenu from "$lib/components/FilterMenu.svelte";
	import PersonalTask from "$lib/components/PersonalTask.svelte";
	import Form from "$lib/components/Form.svelte";
	import PendingDeleteAction from "$lib/components/PendingDeleteAction.svelte";
	import { BrushCleaning, Trash2 } from "@lucide/svelte";
	import {
		nameField,
		categoryField,
		dateField,
		difficultyField,
		memberFields,
	} from "$lib/formFields.js";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { invalidateAll } from "$app/navigation";
	import type { PageProps } from "./$types";
	import ProgressBar from "$lib/components/ProgressBar.svelte";
	import { Role } from "@prisma/client";

	let socket: Socket | null = $state(null);

	/** Retrieves the tasks stored in the database and the errors reported by the form */
	let { data, form }: PageProps = $props();

	let house_code: string | undefined = $derived(data.houseCode); // derived since it can change while in progress
	let previousHouseCode: string | undefined;

	onMount(async () => {
		const { io } = await import("socket.io-client");
		socket = io();
		socket.on("tasksUpdated", () => invalidateAll());
	});

	$effect(() => {
		if (!socket || !house_code) return;

		if (previousHouseCode && previousHouseCode !== house_code) {
			socket.emit("leaveHouse", previousHouseCode);
		}
		socket.emit("house", house_code);
		previousHouseCode = house_code;
	});

	onDestroy(() => {
		if (socket) socket.disconnect();
	});

	function notifyTaskChanged() {
		socket?.emit("taskChanged", { houseCode: house_code });
	}
	/** Household name displayed in the page header. */
	let house_name: string | undefined = $derived(data.houseName);

	/** Today's date formatted in French (e.g. lundi 29 juin 2026). */
	const formatted_date: string = new Date().toLocaleDateString("fr-FR", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	/** Task sorting filters by period or by member. The "Aujourd'hui" filter is active by default. */
	const filters = [
		{ label: "Toutes", value: "all", stateDefault: true },
		{ label: "Dans moins de 7 jours", value: "week", stateDefault: false },
		{ label: "Aujourd'hui", value: "today", stateDefault: false },

		// { label: "Membre", stateDefault: false },
	];

	/** Currently selected period filter, updated when a FilterMenu button is clicked. */
	let selectedFilter: string = $state("all");

	/** True if `date` falls on the same day. */
	function isToday(date: Date): boolean {
		const now = new Date();
		return (
			date.getFullYear() === now.getFullYear() &&
			date.getMonth() === now.getMonth() &&
			date.getDate() === now.getDate()
		);
	}

	/** True if `date` falls between today and today + 7 days. */
	function isThisWeek(date: Date): boolean {
		const startOfToday = new Date();
		startOfToday.setUTCHours(0, 0, 0, 0);
		const in7Days = new Date(startOfToday);
		in7Days.setDate(startOfToday.getDate() + 7);
		return date >= startOfToday && date < in7Days;
	}

	/** Tasks displayed according to selectedFilter. "Toutes" filters nothing; a task without a deadline only appears in "Toutes". */
	let filteredTasks = $derived(
		data.sharedTasks.filter((task) => {
			if (selectedFilter === "all") return true;
			if (!task.endedAt) return false;
			if (selectedFilter === "today") return isToday(task.endedAt);
			if (selectedFilter === "week") return isThisWeek(task.endedAt);
			return true;
		}),
	);

	/** Shared with the parent to open or close the creation form (true = form visible, false = form closed). */
	let newTaskOpen: boolean = $state(false);

	let edit_error: string | null = $state(null);
	/**
	 * @brief Displays a temporary error when the current user cannot edit a shared task.
	 */
	function showEditError() {
		edit_error =
			"Vous ne pouvez pas modifier cette tâche car elle ne vous est pas assignée.";

		setTimeout(() => {
			edit_error = null;
		}, 3000);
	}

	/** Type of a shared task as returned by this page's load(). */
	type SharedTask = (typeof data.sharedTasks)[number];

	/** Task currently being edited (undefined = creation mode). Passed to Form to pre-fill and choose the action. */
	let editingTask: SharedTask | undefined = $state(undefined);

	/** Resets editingTask to undefined as soon as the form closes, whatever the closing path (Cancel, cross, "+"). */
	$effect(() => {
		if (!newTaskOpen) editingTask = undefined;
	});

	/**
	 * @brief Checks whether the current user can edit a shared task.
	 * @param task (SharedTask) The shared task.
	 * @returns true if the current user can edit the task, false otherwise.
	 */

	function canEditTask(task: SharedTask): boolean {
		if (data.current_user.role !== Role.STUDENT) return true;

		if (task.assignees.length === 0) return true;

		return task.assignees.some(
			(assignee) => assignee.id === data.current_user.id,
		);
	}

	/** Opens the form in edit mode for the given task. */
	function openEdit(task: SharedTask) {
		if (!canEditTask(task)) {
			showEditError();
			return;
		}

		editingTask = task;
		newTaskOpen = true;
	}

	/**
	 * @brief Formats the information
	 * @param task (SharedTask) The task
	 * @returns Returns an object with formatted dates, ready for PersonalTask
	 */
	function formatting(task: SharedTask) {
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		const endedAt = task.endedAt ? new Date(task.endedAt) : null;

		const isOverdue = !task.isFinish && endedAt !== null && endedAt < today;

		return {
			id: task.id,
			name: task.nameTask,
			label: task.category,
			xp: task.difficulty,
			isFinish: task.isFinish,
			isOverdue,
			limit_date: endedAt?.toLocaleDateString("fr-FR"),
			finished_date: task.finishedAt?.toLocaleDateString("fr-FR"),
			assignees: task.assignees,
		};
	}

	/**Used to store the id of the task to delete, or undefined if there is no task to delete*/
	let PendingDeleteId: number | undefined = $state(undefined);

	/** Reference to the hidden deletion form, to submit it programmatically (timer, cross-cancellation in RequestDelete). */
	let deleteForm: HTMLFormElement | undefined = $state();

	let delete_error: string | null = $state(null);
	/** Error message displayed when a shared task validation is not allowed. */
	let validation_error: string | null = $state(null);

	/**
	 * @brief Displays a temporary error when the user cannot validate a shared task.
	 * @details Shows an explanatory message for three seconds.
	 */
	function showValidationError() {
		validation_error =
			"Vous ne pouvez valider que vos tâches ou les tâches sans personne assignée.";

		setTimeout(() => {
			validation_error = null;
		}, 3000);
	}

	/**
	 * @brief Handles a shared task deletion request.
	 * @details Prevents students from deleting shared tasks and briefly displays
	 *          an explanatory error message. For authorized users, stores the task
	 *          id as pending deletion and submits any previous pending deletion
	 *          before replacing it.
	 * @param id (number) Identifier of the task to delete.
	 */

	function RequestDelete(id: number) {
		if (data.current_user.role === Role.STUDENT) {
			delete_error = "Vous ne pouvez pas supprimer cette tâche.";

			setTimeout(() => {
				delete_error = null;
			}, 3000);

			return;
		}

		delete_error = null;

		if (PendingDeleteId !== undefined && PendingDeleteId !== id)
			deleteForm?.requestSubmit();

		PendingDeleteId = id;
	}

	/**Used to know whether there are completed tasks to delete*/
	let PendingDeleteChecked: boolean = $state(false);

	/** Reference to the hidden bulk deletion form, to submit it programmatically (timer). */
	let deleteCheckedForm: HTMLFormElement | undefined = $state();
	/**
	 * @brief Checks whether the current user can validate a shared task.
	 * @param task (SharedTask) The shared task.
	 * @returns true if the current user can validate the task, false otherwise.
	 */
	function canValidateTask(task: SharedTask): boolean {
		if (data.current_user.role !== Role.STUDENT) return true;

		if (task.assignees.length === 0) return true;

		return task.assignees.some(
			(assignee) => assignee.id === data.current_user.id,
		);
	}
</script>

<div class="m-0 min-h-screen bg-background font-serif">
	<Header
		url="/home"
		text="Accueil"
		title="Tâches ménagères"
		Icon={BrushCleaning}
		right="task"
		bind:newTaskOpen
		notifications={data.notifications}
		unread_count={data.unreadCount}
	/>
	<p class="mx-4 md:mx-40 py-5">Foyer {house_name}, le {formatted_date}</p>
	{#if newTaskOpen}
		<Form
			bind:newTaskOpen
			{form}
			task={editingTask}
			fields={[
				nameField(editingTask),
				categoryField(editingTask),
				dateField(editingTask),
				difficultyField(editingTask),
				memberFields(data.members, editingTask),
			]}
			onSuccess={notifyTaskChanged}
		/>
	{/if}
	<div class="mx-4 md:mx-40 flex flex-row items-center gap-2">
		<FilterMenu
			{filters}
			name="date"
			multiple={false}
			onChange={(value) => (selectedFilter = value)}
		/>
		{#if data.current_user.role !== Role.STUDENT && data.sharedTasks.some((task) => task.isFinish)}
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
	{#if delete_error}
		<p class="mx-4 md:mx-40 mt-3 text-sm text-red">
			{delete_error}
		</p>
	{/if}

	{#if validation_error}
		<p class="mx-4 md:mx-40 mt-3 text-sm text-red">
			{validation_error}
		</p>
	{/if}

	{#if edit_error}
		<p class="mx-4 md:mx-40 mt-3 text-sm text-red">
			{edit_error}
		</p>
	{/if}

	<div class="flex flex-col gap-3 my-5">
		{#each filteredTasks as task}
			<PersonalTask
				task={formatting(task)}
				onEdit={() => openEdit(task)}
				onDelete={RequestDelete}
				isPendingCancel={task.id === PendingDeleteId ||
					(PendingDeleteChecked && task.isFinish)}
				onSuccess={notifyTaskChanged}
				canValidate={canValidateTask(task)}
				onValidationDenied={showValidationError}
			/>
		{/each}
	</div>
	{#if data.activeMonster}
		<a
			href="/monster"
			class="mx-4 md:mx-40 block rounded-xl border-3 border-dark-golden bg-beige py-2 px-3 gap-2 shadow-sm"
		>
			<p class="font-serif font-bold mb-2">
				{data.activeMonster.template.name}
			</p>
			<ProgressBar
				current={data.activeMonster.currentHp}
				max={data.activeMonster.maxHp}
				color="bg-red"
				textColor="text-red"
				bgColor="bg-beige"
				label="PV"
			/>
		</a>
	{/if}
	<PendingDeleteAction
		bind:formRef={deleteForm}
		bind:pending={PendingDeleteId}
		resetValue={undefined}
		action="?/delete"
		hasPendingDelete={PendingDeleteId !== undefined}
		onSuccess={notifyTaskChanged}
	/>

	<PendingDeleteAction
		bind:formRef={deleteCheckedForm}
		bind:pending={PendingDeleteChecked}
		resetValue={false}
		action="?/deleteChecked"
		hasPendingDelete={PendingDeleteChecked}
		onSuccess={notifyTaskChanged}
	/>
</div>
