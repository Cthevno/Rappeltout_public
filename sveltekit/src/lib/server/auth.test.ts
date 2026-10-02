import { describe, it, expect } from 'vitest';
import { isValidAuth } from './auth';

describe('isValidAuth', () => {
    it('return error if the email or password are too long during login', () => {
        expect(isValidAuth('', '123456789123456789123456789123456789123456789123456789123456789121234567891234567891234567891234567891234567891212345678912345678912345678912@hotmail.fr', '12345678', '')).toBe("Email ou mot de passe trop long !");
        expect(isValidAuth('', 'test@hotmail.fr', '1'.repeat(51), '')).toBe("Email ou mot de passe trop long !");
    });

    it('return error if the username is too long or too short', () => {
        expect(isValidAuth('a'.repeat(21), 'test@hotmail.fr', '12345678', '12345678')).toBe("Pseudo trop long !");
        expect(isValidAuth('a', 'test@hotmail.fr', '12345678', '12345678')).toBe("Pseudo trop court !");
    });

    it('if the email format or length is incorrect', () => {
        expect(isValidAuth('mlaussel', '123456789123456789123456789123456789123456789123456789123456789121234567891234567891234567891234567891234567891212345678912345678912345678912@hotmail.fr', '12345678', '12345678')).toBe("Email trop long !");
        expect(isValidAuth('mlaussel', 'testhotmail.fr', '12345678', '12345678')).toBe("Format de l'email non valide !");
        expect(isValidAuth('mlaussel', 'test#hotmailfr', '12345678', '12345678')).toBe("Format de l'email non valide !");
        expect(isValidAuth('mlaussel', 'testhotmail.', '12345678', '12345678')).toBe("Format de l'email non valide !");
        expect(isValidAuth('mlaussel', '@.fr', '12345678', '12345678')).toBe("Format de l'email non valide !");
    });

    it('return error if the username is too long or too short', () => {
        expect(isValidAuth('mlaussel', 'test@hotmail.fr', '1', '12345678')).toBe("Le mot de passe doit contenir plus de 7 caractères !");
        expect(isValidAuth('mlaussel', 'test@hotmail.fr', '1', '1234567')).toBe("Le mot de passe doit contenir plus de 7 caractères !");
        expect(isValidAuth('mlaussel', 'test@hotmail.fr', '1'.repeat(51), '12345678')).toBe("Mot de passe trop long !");
    });

     it('return error if password and password confirm dont match', () => {
        expect(isValidAuth('mlaussel', 'test@hotmail.fr', '123456789', '12345678')).toBe("Les mots de passe ne correspondent pas !");
        expect(isValidAuth('mlaussel', 'test@hotmail.fr', '12345678', '123456789')).toBe("Les mots de passe ne correspondent pas !");
    });
})