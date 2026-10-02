/**
 * @file auth_validation.ts
 * @brief Contains the validation logic and interfaces for the registration form.
 */

/**
 * @brief Represents the data entered by the user in the registration form.
 */
export interface UserCredentials {
	pseudo: string;
	email: string;
	password: string;
	password_confirm: string;
}
/**
 * @brief Represents the response received from the server after form submission.
 */
export interface FormResponse {
	/** @brief Indicates whether the form submission was successful. */
	success?: boolean;
	/** @brief Contains an error message if the submission failed. */
	error?: string;
	/** @brief Indicates if we can redirect on check code page for 2FA. */
	requires2FA?: boolean;
}

/**
 * @brief Checks if the email format is good.
 * 
 * Validate email format with regular expression used to validate the structure of an email address.
 * 
 * @param email (string) whose format needs to be verified
 * 
 * @return False if not valid, else true
 */
export function isEmailFormatValid(email: string): boolean {

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailRegex.test(email))
		return (false);
	return (true);
}

/**
 * @brief Checks if the username format is good.
 * 
 * Validate username format with regular expression used to validate the structure of an email address.
 * 
 * @param username (string) whose format needs to be verified
 * 
 * @return False if not valid, else true
 */
export function isUsernameFormatValid(username: string): boolean {
	const usernameRegex = /^[a-zA-Z0-9_.+-]+$/;

	if (!usernameRegex.test(username))
		return (false);
	return (true);
}

/**
 * @brief Validates the form data and returns a corresponding error message if invalid.
 * 
 * Checks for email format, password match, password length, pseudo length, 
 * and email length. Also checks for server-side errors passed in the form response.
 * 
 * @param credentials (UserCredentials) The form data containing user inputs.
 * @param form (FormResponse) The server response containing potential server-side errors.
 * @return An error message string if validation fails, or null if the data is valid.
 */
export function validateEmail(credentials: UserCredentials, form: FormResponse | null): string | null {
	const { pseudo, email, password, password_confirm } = credentials;

	if (email !== "" && !isEmailFormatValid(email))
		return ("L'adresse mail n'est pas valide !");
	else if (password !== "" && password_confirm !== "" && password !== password_confirm)
		return ("Les mots de passe ne correspondent pas !");
	else if (password !== "" && password.length < 8)
		return ("Le mot de passe doit contenir plus de 7 caractères !");
	else if ((password !== "" && password.length > 50) || (password_confirm !== "" && password_confirm.length > 50))
		return ("Le mot de passe doit contenir moins de 50 caractères !");
	else if (pseudo !== "" && pseudo.length > 20)
		return ("Le pseudo doit faire moins de 20 caractères !");
	else if (pseudo.length < 2)
		return ("Pseudo trop court !");
	if (pseudo !== "" && !isUsernameFormatValid(pseudo))
		return ("Le pseudo ne peut contenir que des lettres, chiffres, tirets, point, le caractère plus et underscores.");
	else if (email !== "" && email.length > 100)
		return ("L'email est trop long !");
	if (form?.error)
		return (form.error);
	else
		return (null);
}

/**
 * @brief Checks if the form data meets all strict validity requirements.
 * 
 * Validates that the pseudo is not empty (after trimming), the email matches 
 * the regex, the password is at least 8 characters long, and the passwords match.
 * 
 * @param credentials (UserCredentials) The form data containing user inputs.
 * @return True if the form is completely valid, false otherwise.
 */
export function isFormValid(credentials: UserCredentials): boolean {
	const { pseudo, email, password, password_confirm } = credentials;

	return (
		pseudo.trim().length >= 2 &&
		isEmailFormatValid(email) &&
		email.length <= 100 &&
		password.length >= 8 &&
		password.length <= 50 &&
		password == password_confirm &&
		isUsernameFormatValid(pseudo)
	);
}

/**
 * Checks if the form data meets all strict validity requirements in /auth/check
 * @param code (string) code 2FA to check
 * @returns True if the form is completely valid, false otherwise.
 */
export function isCodeFormValid(code: string): boolean {
	const formatCode = /^\d{6}$/;
	return (formatCode.test(code));
}

/**
 * @brief Checks if the code for the authentification is good.
 * 
 * Validates that the code is not empty (after trimming), and the code is 6 characters long.
 * 
 * @param code (string) the 6 digit verification code
 * 
 * @return  An error message string if validation fails, or null if the data is valid.
 */
export function isCodeAuthValid(code: string): string | null {
	const formatCode = /^\d{6}$/;
	if (code.trim() === "")
		return ("Le code de vérification ne peut pas être vide.");
	else if (!formatCode.test(code))
		return ("Le code de vérification doit contenir exactement 6 chiffres.");
	else
		return (null);
}

/**
 * Checks if the form data meets all strict validity requirements in /auth/emailConnexion
 * @param email (string) email to check
 * @param password (string) password to check
 * @returns True if the form is completely valid, false otherwise.
 */
export function isEmailConnexionFormValid(email: string, password: string): boolean {
	return (
		isEmailFormatValid(email) &&
		email.length <= 100 &&
		password.length >= 8 &&
		password.length <= 50
	);
}

/**
 * @brief Checks if the email and password for the connexion email authentification is good.
 * 
 * Validates that the email and password are not empty (after trimming), the format and the length.
 * 
 * @param email (string) used for login
 * @param password (string) used for login
 * 
 * @return  An error message string if validation fails, or null if the data is valid.
 */
export function emailConnexionTest(email: string, password: string): string | null {
	if (email.trim() === "" || password.trim() == "")
		return ("Email ou mot de passe manquant");
	else if (email.length > 100 || password.length > 50)
		return ("Email ou mot de passe trop long !");
	else if (!isEmailFormatValid(email))
		return ("Format de l'email non valide !");
	else if (password.length < 8)
		return ("Le mot de passe doit contenir plus de 7 caractères !");
	else
		return (null);
}

/**
 * Checks if the form data meets all strict validity requirements in /auth/forgot
 * @param email (string) email to check
 * @returns True if the form is completely valid, false otherwise.
 */
export function isForgotFormValid(email: string): boolean {
	return (
		isEmailFormatValid(email) &&
		email.length <= 100
	);
}

/**
 * @brief Checks if the email for forgot email authentification is good.
 * 
 * Validates that the email and password are not empty (after trimming), the format and the length.
 * 
 * @param email (string) used to receive the reset link via email
 * 
 * @return  An error message string if validation fails, or null if the data is valid.
 */
export function forgotTest(email: string): string | null {
	if (email.trim() === "")
		return ("Email manquant !");
	else if (email.length > 100)
		return ("Email trop long !");
	else if (!isEmailFormatValid(email))
		return ("Format de l'email non valide !");
	else
		return (null);
}

/**
 * Checks if the form data meets all strict validity requirements in /auth/resetPassword
 * @param password (string) password to check
 * @param password_confirm (string) password_confirm to check
 * @returns True if the form is completely valid, false otherwise.
 */
export function isResetPasswordFormValid(password: string, password_confirm: string): boolean {
	return (
		password.length >= 8 &&
		password.length <= 50 &&
		password == password_confirm
	);
}

/**
 * @brief Checks if the password for reset password authentification is good.
 * 
 * Validates that the password is not empty (after trimming), the password is at least 8 characters long, and the passwords match.
 * 
 * @param password (string) the new one after the reset
 * @param password_confirm (string) the new one after the reset
 * 
 * @return  An error message string if validation fails, or null if the data is valid.
 */
export function resetPasswordTest(password: string, password_confirm: string): string | null {
	if (password_confirm.trim() === "" || password.trim() == "")
		return ("Au moins un element est vide !");
	if (password !== "" && password_confirm !== "" && password !== password_confirm)
		return ("Les mots de passe ne correspondent pas !");
	else if (password !== "" && password.length < 8)
		return ("Le mot de passe doit contenir plus de 7 caractères !");
	else if ((password !== "" && password.length > 50) || (password_confirm !== "" && password_confirm.length > 50))
		return ("Mot de passe trop long !");
	else
		return (null);
}

