import { sendMail } from '$lib/server/email.js';
import { create_notification } from '$lib/server/notification';
import { emitNotificationUpdate } from '$lib/server/notificationsWebSockets';
import dns from 'dns/promises';

/**
 * @brief Notify of an email sending failure.
 *
 * @param userId (number) The user id of the user who will receive the notification.
 * @param email (string) The email that failed.
 * @param reason (string) A reason to append to the notification content.
 */
export async function notifyFailure(
	userId: number,
	email: string,
	reason: string
): Promise<void> {
	try {
		await create_notification(
			userId,
			'INVITATION',
			"Échec d'envoi d'email",
			`L'invitation à ${email} n'a pas pu être envoyée. ${reason}`,
			'/notifications'
		);
		emitNotificationUpdate(userId);
	} catch (notifErr) {
		console.error('Failed to create failure notification:', notifErr);
	}
}

/**
 * @brief Checks that the email's domain has valid MX records.
 *
 * @param email The email address to check.
 *
 * @returns True if the domain can receive mail.
 */
export async function isEmailDomainValid(email: string): Promise<boolean> {
	const domain = email.split('@')[1];
	if (!domain) return false;
	try {
		const mxRecords = await dns.resolveMx(domain);
		return mxRecords.length > 0;
	} catch {
		// resolveMx throws if the domain doesn't exist or has no MX records
		return false;
	}
}

/**
 * @brief Sends the invitation email, pre-validating the domain to catch
 * obvious typos before they become silent bounces.
 *
 * Fires the SMTP call without blocking the caller; on any failure
 * (DNS validation or SMTP rejection) creates an in-app notification.
 *
 * @param email (string) The email to send the invitation to.
 * @param code (string) The house invitation code.
 * @param userId (number) The id of the user sending the invitation.
 */
export async function sendInvitationMail(
	email: string,
	code: string,
	userId: number): Promise<void> {
	if (!(await isEmailDomainValid(email))) {
		await notifyFailure(userId, email, "Le nom de domaine n'existe pas.");
		return;
	}

	void (async () => {
		await sendMail(
			email,
			"Votre invitation pour rejoindre un foyer sur Rappeltout !",
			`Merci de renseigner le code d'invitation '${code}' `
			+ "dans l'onglet rejoindre un foyer : https://localhost:8443/house\n"
			+ "Attention, vous ne pouvez faire parti que d'un seul foyer. "
			+ "Vous devrez donc quitter votre foyer actuel avant d'en rejoindre "
			+ "un nouveau."
		);
	})().catch(async (err) => {
		console.error('Invitation email failed: ', err);
		await notifyFailure(userId, email, "Le serveur SMTP a refusé l'envoi.");
	});
}
