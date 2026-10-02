import { isEmailFormatValid, isUsernameFormatValid } from "../../routes/auth/auth_validation";

/**
 * @file auth.ts
 * @brief Validates authentication input fields for registration and login.
 * 
 * This function checks user inputs against specific business rules, including 
 * length constraints, email format validation using a regex pattern, and 
 * password confirmation matching.
 * 
 * @param username (string) The username input to validate.
 * @param email (string) The email input to validate.
 * @param password (string) The password input to validate.
 * @param password_confirm (string) The password confirmation input to match against the main password.
 * 
 * @returns An empty string if all validations pass, or an error message string if any rule is violated.
 */
export function isValidAuth(username: string, email: string, password: string, password_confirm: string): string {

    //------- check for connexion email
    if (!username && !password_confirm && email && password && (email.length > 100 || password.length > 50))
        return ("Email ou mot de passe trop long !");

    //------- username format
    if (username !== "" && !isUsernameFormatValid(username))
        return ("Le pseudo ne peut contenir que des lettres, chiffres, tirets, point, le caractère plus et underscores.");

    //------- username length
    if (username) {
        if (username.length > 20) {
            return ("Pseudo trop long !");
        }
        if (username.length < 2) {
            return ("Pseudo trop court !");
        }
    }

    //------- email format and length
    if (email) {

        if (!isEmailFormatValid(email))
            return ("Format de l'email non valide !");
        else if (email.length > 100)
            return ("Email trop long !");
    }

    //------- password length
    if (password) {
        if (password.length < 8) {
            return ("Le mot de passe doit contenir plus de 7 caractères !");
        }
        else if (password.length > 50) {
            return ("Mot de passe trop long !");
        }
    }

    //------- not same password
    if (password && password_confirm && password !== password_confirm)
        return ("Les mots de passe ne correspondent pas !");

    return ("");
}

