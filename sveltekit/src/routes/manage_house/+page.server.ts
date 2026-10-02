import { prisma } from '$lib/server/prisma'
import { redirect, fail } from '@sveltejs/kit';
import { generateCode } from '$lib/generateCode.js';
import { Prisma, Role } from "@prisma/client"
import { sendInvitationMail, isEmailDomainValid, notifyFailure } from '$lib/server/sendInvitationMail';
import { create_notification } from '$lib/server/notification';
import { emitNotificationUpdate } from '$lib/server/notificationsWebSockets';
import { HomeUpdate } from '$lib/server/homeWebSockets';
import { getIO } from "$lib/server/socketInstance";
import { Action, can, canRemoveMember, canTransferHeadmaster } from '$lib/server/permissions';

// Retrieves the household of which the given user is a member
function findUserHouse(userId: number) {
	return prisma.house.findFirst({
		where: { members: { some: { id: userId } } }
	});
}

export const actions = {
	accept: async ({ request, locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		if (!can(locals.user.role, Action.INVITE_MEMBER))
			return fail(403, { error: "Action non autorisée" });

		// Retrieves the id of the user to add
		const formData = await request.formData();
		const pendingId = Number(formData.get("pendingId"));

		const house = await prisma.house.findFirst({
			where: { members: { some: { id: locals.user.id } } },
			include: {
				pendingMembers: {
					select: {
						id: true,
						username: true
					}
				},
				members: {
					select: {
						id: true
					}
				}
			}
		});

		if (!house) return;

		const isPending = house.pendingMembers.some((m) => m.id === pendingId);
		if (!isPending)
			return fail(404, { error: "Demande introuvable" });

		await prisma.$transaction([
			prisma.house.update({
				where: { code: house.code },
				data: {
					pendingMembers: { disconnect: { id: pendingId } },
					members: { connect: { id: pendingId } }
				}
			}),
			prisma.user.update({
				where: { id: pendingId },
				data: { role: Role.STUDENT }
			})
		]);

		// Informs the user that their request to join the household has been accepted
		await create_notification(
			pendingId,
			'INVITATION',
			'Demande acceptée',
			`Ta demande pour rejoindre le foyer "${house.houseName}" a été acceptée.`,
			'/home'
		);
		const acceptedMember = house.pendingMembers.find(
			(member) => member.id === pendingId
		);

		if (acceptedMember) {
			for (const member of house.members) {
				await create_notification(
					member.id,
					'INVITATION',
					'Nouveau membre dans le foyer',
					`${acceptedMember.username} a rejoint le foyer "${house.houseName}".`,
					'/house'
				);
			}
		}

		const io = getIO();
		if (io)
			HomeUpdate(io, house.code);

		emitNotificationUpdate(pendingId);

	},

	reject: async ({ request, locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		if (!can(locals.user.role, Action.INVITE_MEMBER))
			return fail(403, { error: "Action non autorisée" });

		// Retrieves the id of the user to reject
		const formData = await request.formData();
		const pendingId = Number(formData.get("pendingId"));
		const house = await findUserHouse(locals.user.id);
		if (!house) return;

		// Removes the user to reject from the pendingMembers list
		await prisma.house.update({
			where: { code: house.code },
			data: {
				pendingMembers: { disconnect: { id: pendingId } },
			}
		});

		await create_notification(
			pendingId,
			'INVITATION',
			'Demande refusée',
			`Ta demande pour rejoindre le foyer "${house.houseName}" a été refusée.`,
			'/home'
		);

		const io = getIO();
		if (io)
			HomeUpdate(io, house.code);
	},

	renameHouse: async ({ request, locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		if (!can(locals.user.role, Action.EDIT_HOUSE))
			return fail(403, { error: "Action non autorisée" });

		// Retrieves the new household name
		const formData = await request.formData();
		const houseName = formData.get("houseName")?.toString() ?? '';

		if (!houseName)
			return fail(400, { error: "Le nom du foyer ne peut pas être vide" });
		if (houseName.length > 60)
			return fail(400, { error: "Le nom du foyer ne peut pas dépasser 60 caractères" });
		const house = await prisma.house.findFirst({
			where: {
				members: {
					some: { id: locals.user.id }
				}
			},
			include: {
				members: {
					select: { id: true }
				}
			}
		});

		if (!house)
			return fail(404, { error: "Foyer introuvable" });

		// Updates the household's name
		await prisma.house.update({
			where: { code: house.code },
			data: {
				houseName: houseName,
			}
		})
		for (const member of house.members) {
			await create_notification(
				member.id,
				'INVITATION',
				'Foyer renommé',
				`Le foyer s'appelle maintenant "${houseName}".`,
				'/house'
			);
		}
	},

	regenerateCode: async ({ locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		if (!can(locals.user.role, Action.EDIT_HOUSE))
			return fail(403, { error: "Action non autorisée" });
		const house = await findUserHouse(locals.user.id);

		if (!house) return;

		// Generates a new code and retries if it collides with an existing code
		let new_code: string;
		while (true) {
			new_code = generateCode();
			try {
				await prisma.house.update({
					where: { code: house.code },
					data: {
						code: new_code,
					}
				});
				break;
			} catch (error) {
				// P2002 = unique constraint violation
				if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
					continue;
				}
				throw (error);
			}
		}

		// Notifies clients still connected to the old house room so they reload
		// their data and rejoin under the new code.
		const io = getIO();
		if (io)
			HomeUpdate(io, house.code);
	},

	createInvitation: async ({ request, locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		if (!can(locals.user.role, Action.INVITE_MEMBER))
			return fail(403, { error: "Action non autorisée" });
		const formData = await request.formData();
		const email = formData.get("email")?.toString().trim().toLowerCase() ?? '';

		if (!email)
			return fail(400, { error: "Email requis" });

		// Validate domain FIRST before any database operations
		if (!(await isEmailDomainValid(email))) {
			await notifyFailure(locals.user.id, email, "Le nom de domaine n'existe pas.");
			return fail(400, { error: "Le nom de domaine de cet email n'existe pas." });
		}

		const house = await findUserHouse(locals.user.id);

		if (!house)
			return fail(404, { error: "Foyer introuvable" });

		// Checks that the email does not already belong to a household member (case-insensitive comparison)
		const alreadyMember = await prisma.house.findFirst({
			where: { code: house.code, members: { some: { email: { equals: email, mode: 'insensitive' } } } }
		});

		if (alreadyMember)
			return fail(400, { error: "Cette personne est déjà membre du foyer" });

		// Checks that an invitation does not already exist for this email in this household
		const existingInvitation = await prisma.invitation.findUnique({
			where: { email_houseCode: { email, houseCode: house.code } }
		});

		if (existingInvitation)
			return fail(400, { error: "Une invitation est déjà en attente pour cet email" });

		try {
			await prisma.invitation.create({
				data: {
					email,
					houseCode: house.code,
				}
			});
			const io = getIO();
			if (io)
				HomeUpdate(io, house.code);
		} catch (error) {
			// P2002 = unique constraint violation: an invitation was created in the meantime (double submission)
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
				return fail(400, { error: "Une invitation est déjà en attente pour cet email" });
			throw error;
		}

		await sendInvitationMail(email, house.code, locals.user.id);
	},

	sendInvitation: async ({ request, locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		if (!can(locals.user.role, Action.INVITE_MEMBER))
			return fail(403, { error: "Action non autorisée" });

		// Retrieves the id of the invitation to resend
		const formData = await request.formData();
		const rawInvitationId = formData.get("invitationId");

		if (rawInvitationId === null)
			return;

		const invitationId = Number(rawInvitationId);

		if (Number.isNaN(invitationId))
			return;

		const house = await findUserHouse(locals.user.id);

		if (!house) return;

		// Looks for the matching invitation among the household's pending invitations
		const invitation = await prisma.invitation.findFirst({
			where: { id: invitationId, houseCode: house.code }
		});

		if (!invitation) return;

		// Resends the invitation email
		sendInvitationMail(invitation.email, house.code, locals.user.id);
	},

	deleteInvitation: async ({ request, locals }) => {
        if (!locals.user)
            throw redirect(303, '/auth/welcome');
        if (!can(locals.user.role, Action.INVITE_MEMBER))
            return fail(403, { error: "Action non autorisée" });

        // Retrieves the id of the invitation to delete
        const formData = await request.formData();
        const rawInvitationId = formData.get("invitationId");

        if (rawInvitationId === null)
            return fail(400, { error: "ID d'invitation manquant" });

        const invitationId = Number(rawInvitationId);

        if (Number.isNaN(invitationId))
            return fail(400, { error: "ID d'invitation non valide" });

        const house = await findUserHouse(locals.user.id);

        if (!house) return fail(404, { error: "Foyer introuvable" });

        // Looks for the matching invitation among the household's invitations to ensure security
        const invitation = await prisma.invitation.findFirst({
            where: { id: invitationId, houseCode: house.code }
        });

        if (!invitation)
            return fail(404, { error: "Invitation introuvable" });

        // Deletes the invitation from the database
        await prisma.invitation.delete({
            where: { id: invitationId }
        });

        return { success: true };
    },
	
	deleteHouse: async ({ locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		if (!can(locals.user.role, Action.EDIT_HOUSE))
			return fail(403, { error: "Action non autorisée" });
		const house = await prisma.house.findFirst({
			where: { creatorId: locals.user.id },
			include: { members: { select: { id: true } } }
		});

		if (!house)
			return fail(404, { error: "Vous n'êtes pas autorisé à supprimer le foyer" });

		for (const member of house.members) {
			await create_notification(
				member.id,
				'INVITATION',
				'Foyer supprimé',
				`Le foyer "${house.houseName}" a été supprimé. Tu peux en créer un autre ou en rejoindre un nouveau.`,
				null
			);
		}

		await prisma.$transaction([
			prisma.house.delete({
				where: { code: house.code }
			}),
			...house.members.map((member) =>
				prisma.user.update({
					where: { id: member.id },
					data: { role: Role.STUDENT }
				})
			)
		]);

		throw redirect(303, "/home");
	},

	changeRole: async ({ locals, request }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		if (!can(locals.user.role, Action.CHANGE_ROLE))
			return fail(403, { error: "Action non autorisée" });

		const formData = await request.formData();
		const memberId = Number(formData.get("memberId"));
		const newRole = formData.get("role")?.toString();

		if (!memberId || !newRole)
			return fail(400, { error: "Membre ou rôle invalide" });

		if (memberId === locals.user.id)
			return fail(403, { error: "Vous ne pouvez pas modifier votre propre rôle" });

		if (newRole !== Role.TEACHER && newRole !== Role.STUDENT)
			return fail(400, { error: "Rôle invalide" });

		const house = await prisma.house.findFirst({
			where: { members: { some: { id: locals.user.id } } },
			include: {
				members: {
					select: {
						id: true,
						role: true
					}
				}
			}
		});
		if (!house)
			return fail(404, { error: "Foyer introuvable" });
		const target_member = house.members.find((member) => member.id === memberId);
		if (!target_member)
			return fail(404, { error: "Membre introuvable" });
		if (target_member.role === Role.HEADMASTER)
			return fail(403, { error: "Le rôle du directeur ne peut pas être modifié" });
		await prisma.user.update({
			where: { id: memberId },
			data: { role: newRole as Role }
		});
		const role_label =
			newRole === Role.TEACHER ? "Professeur" : "Étudiant";

		await create_notification(
			memberId,
			'INVITATION',
			'Rôle modifié',
			`Ton rôle dans le foyer "${house.houseName}" est maintenant ${role_label}.`,
			'/house'
		);
	},

	transferHeadmaster: async ({ locals, request }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		const formData = await request.formData();
		const target_id = Number(formData.get("memberId"));
		if (!target_id)
			return fail(400, { error: "Membre invalide" });
		if (!canTransferHeadmaster(
			locals.user.role,
			locals.user.id,
			target_id
		))
			return fail(403, { error: "Action non autorisée" });
		const house = await prisma.house.findFirst({
			where: {
				creatorId: locals.user.id,
				members: {
					some: { id: locals.user.id }
				}
			},
			include: {
				members: {
					select: {
						id: true
					}
				}
			}
		});
		if (!house)
			return fail(404, { error: "Foyer introuvable" });
		const target_member = house.members.find(
			(member) => member.id === target_id
		);
		if (!target_member)
			return fail(404, { error: "Membre introuvable" });
		await prisma.$transaction([
			prisma.user.update({
				where: { id: locals.user.id },
				data: { role: Role.TEACHER }
			}),
			prisma.user.update({
				where: { id: target_id },
				data: { role: Role.HEADMASTER }
			}),
			prisma.house.update({
				where: { code: house.code },
				data: { creatorId: target_id }
			})
		]);
		await create_notification(
			target_id,
			'INVITATION',
			'Nouveau rôle : Directeur',
			`Tu es maintenant Directeur du foyer "${house.houseName}".`,
			'/house'
		);
	},

	deleteMember: async ({ locals, request }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		if (!can(locals.user.role, Action.REMOVE_MEMBER))
			return fail(403, { error: "Action non autorisée" });
		const formData = await request.formData();
		const memberId = Number(formData.get("memberId"));

		if (!memberId)
			return;

		const house = await prisma.house.findFirst({
			where: { members: { some: { id: locals.user.id } } },
			include: {
				members: {
					select: {
						id: true,
						role: true
					}
				}
			}
		});

		if (!house)
			return;

		const target_member = house.members.find((member) => member.id === memberId);

		if (!target_member)
			return;

		if (!canRemoveMember(locals.user.role, target_member.role))
			return fail(403, { error: "Action non autorisée" });

		const isTargetCreator = house.creatorId === memberId;
		const remainingMembers = house.members.filter((m) => m.id !== memberId);
		const assignedTasks = await prisma.sharedTask.findMany({
			where: {
				houseCode: house.code,
				assignees: {
					some: { id: memberId }
				}
			},
			select: { id: true }
		});
		if (isTargetCreator && remainingMembers.length === 0) {
			// The removed member was the last one in the household: nobody left, delete it
			await prisma.house.delete({ where: { code: house.code } });
		} else {
			// Removes the targeted member from the household's member list
			await prisma.$transaction([
				...assignedTasks.map((task) =>
					prisma.sharedTask.update({
						where: { id: task.id },
						data: {
							assignees: {
								disconnect: { id: memberId }
							}
						}
					})
				),
				prisma.house.update({
					where: { code: house.code },
					data: {
						members: { disconnect: { id: memberId } }
					}
				}),
				prisma.user.update({
					where: { id: memberId },
					data: { role: Role.STUDENT }
				}),
				prisma.taskCompletion.deleteMany({
        			where: { userId: memberId, sharedTask: { houseCode: house.code } }
				})
			]);
			await create_notification(
				memberId,
				'INVITATION',
				'Retrait du foyer',
				`Tu as été retiré du foyer "${house.houseName}".`,
				null
			);
		}
		const io = getIO();
		if (io)
			HomeUpdate(io, house.code);
	},

	leaveHouse: async ({ locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		const userId = locals.user.id;
		if (!can(locals.user.role, Action.LEAVE_HOUSE))
			return fail(403, { error: "Action non autorisée" });
		const house = await prisma.house.findFirst({
			where: {
				members: {
					some: { id: locals.user.id }
				}
			},
			include: {
				members: {
					select: {
						id: true
					}
				}
			}
		});
		if (!house)
			return fail(404, { error: "Foyer introuvable" });
		const assignedTasks = await prisma.sharedTask.findMany({
			where: {
				houseCode: house.code,
				assignees: {
					some: { id: userId }
				}
			},
			select: { id: true }
		});
		const is_headmaster = locals.user.role === Role.HEADMASTER;
		if (is_headmaster && house.members.length > 1)
			return fail(403, {
				error: "Vous devez transférer la direction avant de quitter le foyer"
			});
		if (is_headmaster) {
			await prisma.$transaction([
				prisma.house.delete({
					where: { code: house.code }
				}),
				prisma.user.update({
					where: { id: locals.user.id },
					data: { role: Role.STUDENT }
				})
			]);
		} else {
			await prisma.$transaction([
				...assignedTasks.map((task) =>
					prisma.sharedTask.update({
						where: { id: task.id },
						data: {
							assignees: {
								disconnect: { id: userId }
							}
						}
					})
				),
				prisma.house.update({
					where: { code: house.code },
					data: {
						members: {
							disconnect: { id: locals.user.id }
						}
					}
				}),
				prisma.user.update({
					where: { id: locals.user.id },
					data: { role: Role.STUDENT }
				}),
				prisma.taskCompletion.deleteMany({
        			where: { userId: locals.user.id, sharedTask: { houseCode: house.code } }
				})
			]);
			for (const member of house.members) {
				if (member.id === userId)
					continue;

				await create_notification(
					member.id,
					'INVITATION',
					'Un membre a quitté le foyer',
					`${locals.user.username} a quitté le foyer.`,
					'/house'
				);
			}
		}
		throw redirect(303, "/home");
	}
}

// Retrieves the data from Prisma and returns it to the frontend
export const load = async ({ locals }) => {
	if (!locals.user)
		throw redirect(303, '/auth/welcome');

	// Retrieves the household you're a member of, as well as the pending requests/invitations for that same household
	const house = await prisma.house.findFirst({
		where: {
			members: { some: { id: locals.user.id } }
		},
		include: {
			pendingMembers: { select: { id: true, username: true } },
			members: { select: { id: true, username: true, role: true } },
			invitations: { select: { id: true, email: true } }
		}
	});

	return {
		current_user: {
			id: locals.user.id,
			role: locals.user.role
		},
		pendingMembers: house?.pendingMembers ?? [],
		houseName: house?.houseName,
		code: house?.code.toString() ?? "",
		members: house?.members ?? [],
		pendingInvitations: house?.invitations ?? [],
		seo: { title: "Paramètres Foyer - Rappeltout" }
	};
}
