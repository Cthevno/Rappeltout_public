import { isUsernameFormatValid } from "../../routes/auth/auth_validation";
/**
 * Checks if the form data meets all strict validity requirements in /settings
 * @param username (string) password to check
 * @param password (string) password to check
 * @param password_new (string) password_confirm to check
 * @param password_confirm (string) password_confirm to check
 * @returns True if the form is completely valid, false otherwise.
 */
export function isSettingsFormValid(username: string, password: string, password_new: string, password_confirm: string, isGoogleUser: boolean): boolean {
	const usernameForm = username.length >= 2 && username.length <= 20 && isUsernameFormatValid(username);
    
    if (isGoogleUser) {
        return usernameForm;
    }
    const tryChangePassowrd = password.length > 0 || password_new.length > 0 || password_confirm.length > 0;
    const passwordForm = password.length >= 8 &&
                password.length <= 50 && 
                password_new.length >= 8 &&
                password_new.length <= 50 && 
                password_new == password_confirm;

    if (tryChangePassowrd)
        return usernameForm && passwordForm;

    return usernameForm
}

/**
 * @brief Checks if settings form is valid.
 *
 * @param username (string) username of user
 * @param password (string) actual password
 * @param password_new (string) new password
 * @param password_confirm (string) confirmation password
 * 
 * @return  An error message if not valid, else nothing
 */
export function settingsTest(username?: string, password?: string, password_new?: string,  password_confirm?: string) : string | null
{
    if (username && username !== "" && !isUsernameFormatValid(username))
        return ("Le pseudo ne peut contenir que des lettres, chiffres, tirets, point, le caractère plus et underscores.");
    else if (username && username.length < 2)
        return("Le pseudo est trop court !");
    else if (username && username.length > 20)
        return("Le pseudo ne peut pas dépasser 20 caractères !");
    else if (password && password.length > 50)
        return ("Le mot de passe est trop long !" );
    else if (password_new && password_new.length > 50)
        return ("Le mot de passe est trop long !" );
     else if (password_confirm && password_confirm.length > 50)
         return ("Le mot de passe est trop long !" );
    else if (password && password.length < 8)
        return ("Le mot de passe est trop court !" );
    else if (password_new && password_new.length < 8)
        return ("Le mot de passe est trop court !" );
    else if (password_confirm && password_confirm.length < 8)
        return ("Le mot de passe est trop court !" );
    else if (password_new !== password_confirm)
        return ("Les mots de passe ne correspondent pas !");
    else
        return(null);
}