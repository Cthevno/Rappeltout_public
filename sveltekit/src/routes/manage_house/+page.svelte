<script lang="ts">
    /**
     * @file +page.svelte
     * @brief Household management page.
     * @details Successively displays: the household's identity (name, renaming), the invitation code,
     * pending membership requests, pending sent invitations, the list of members
     * with their roles, and a danger zone to leave the household.
     */
    import Header from "$lib/components/Header.svelte";
    import InformationalMessage from "$lib/components/InformationalMessage.svelte";
    import StylizedTitle from "$lib/components/StylizedTitle.svelte";
    import { Clock, UserCog } from "@lucide/svelte";
    import PendingMemberCard from "$lib/components/manage_house/PendingMemberCard.svelte";
    import DangerZoneCard from "$lib/components/manage_house/DangerZoneCard.svelte";
    import PendingInvitationCard from "$lib/components/manage_house/PendingInvitationCard.svelte";
    import HouseIdentityCard from "$lib/components/manage_house/HouseIdentityCard.svelte";
    import InvitationCodeCard from "$lib/components/manage_house/InvitationCodeCard.svelte";
    import MemberRoleCard from "$lib/components/manage_house/MemberRoleCard.svelte";
    import type { Socket } from "socket.io-client";
    import { onMount, onDestroy } from "svelte";
    import { invalidateAll } from "$app/navigation";
    import type { PageProps } from "./$types";
    import { Role } from "@prisma/client";
    import TransferHeadmasterForm from "$lib/components/manage_house/TransferHeadmasterForm.svelte";

    let { data, form }: PageProps = $props();

    let socket: Socket | null = $state(null);
    let house_code: string | undefined = $derived(data.code);
    let previousHouseCode: string | undefined;
    let open_transfer_form = $state(false);

    onMount(async () => {
        const { io } = await import("socket.io-client");
        socket = io();
        socket.on("houseUpdated", () => invalidateAll());
        socket.on("HomeUpdate", () => invalidateAll());
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

    function notifyHouseChanged() {
        socket?.emit("houseChanged", { houseCode: house_code });
    }
</script>

<main class="min-h-screen bg-background font-serif">
    <!-- ==========================================================================================
     HEADER
     ========================================================================================== -->
    <Header
        url="/house"
        text="Foyer"
        title="Gérer le foyer"
        Icon={UserCog}
        right="nothing"
        notifications={data.notifications}
        unread_count={data.unreadCount}
    />

    <div
        class="mx-auto w-full max-w-[800px] px-4 pt-5 pb-8 sm:px-6 sm:pt-6 sm:pb-10"
    >
        <!-- ==========================================================================================
        IDENTITY
         ========================================================================================== -->
        <StylizedTitle title="IDENTITE" contained={false} />
        <HouseIdentityCard
            house_name={data.houseName ?? ""}
            current_user={data.current_user}
            onSuccess={notifyHouseChanged}
        />

        <!-- ==========================================================================================
        INVITATION CODE
         ========================================================================================== -->
        <StylizedTitle title="CODE D'INVITATION" contained={false} />
        <InvitationCodeCard
            code={data.code}
            current_user={data.current_user}
            onSuccess={notifyHouseChanged}
        />

        <!-- ==========================================================================================
         PENDING REQUESTS
         ========================================================================================== -->
        <StylizedTitle title="DEMANDES EN ATTENTE" contained={false} />
        {#if data.pendingMembers.length === 0}
            <div class="mt-5 mb-5 sm:mt-6 sm:mb-6">
                <InformationalMessage
                    text="Aucune demande en attente"
                    Icon={Clock}
                />
            </div>
        {:else}
            <div class="space-y-3 mt-5 mb-5 sm:mt-6 sm:mb-6">
                {#each data.pendingMembers as pending (pending.id)}
                    <PendingMemberCard
                        {pending}
                        current_user={data.current_user}
                        onSuccess={notifyHouseChanged}
                    />
                {/each}
            </div>
        {/if}

        <!-- ==========================================================================================
         PENDING INVITATION
         ========================================================================================== -->
        <StylizedTitle title="INVITATION EN ATTENTE" contained={false} />
        {#if data.pendingInvitations.length === 0}
            <div class="mt-5 mb-5 sm:mt-6 sm:mb-6">
                <InformationalMessage
                    text="Aucune invitation en attente"
                    Icon={Clock}
                />
            </div>
        {:else}
            <div class="space-y-3 mt-5 mb-5 sm:mt-6 sm:mb-6">
                {#each data.pendingInvitations as pending}
                    <PendingInvitationCard
                        {pending}
                        current_user={data.current_user}
                        onSuccess={notifyHouseChanged}
                    />
                {/each}
            </div>
        {/if}

        <!-- ==========================================================================================
        MEMBERS & ROLES
         ========================================================================================== -->
        <StylizedTitle title="MEMBRES & RÔLES" contained={false} />

        {#each data.members as member}
            <MemberRoleCard
                {member}
                current_user={data.current_user}
                formaction="?/deleteMember"
                onSuccess={notifyHouseChanged}
                onTransferHeadmaster={data.members.length > 1
                    ? () => (open_transfer_form = true)
                    : undefined}
            />
        {/each}

        {#if open_transfer_form && data.current_user.role === Role.HEADMASTER}
            <TransferHeadmasterForm
                bind:open_form={open_transfer_form}
                members={data.members.filter(
                    (member) => member.id !== data.current_user.id,
                )}
                onSuccess={notifyHouseChanged}
            />
        {/if}
        <!-- ==========================================================================================
        DANGER ZONE
         ========================================================================================== -->
        <StylizedTitle title="ZONE DANGEREUSE" contained={false} />
        <DangerZoneCard
            formaction="?/deleteHouse"
            current_user={data.current_user}
            member_count={data.members.length}
            {form}
        />
    </div>
</main>
