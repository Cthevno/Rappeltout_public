import { describe, it, expect } from 'vitest';
import { validateEmail, isFormValid, isEmailFormatValid, isCodeAuthValid, emailConnexionTest, forgotTest, resetPasswordTest } from './auth_validation';

describe('isEmailFormatValid', () => {
	it('validates correct emails', () => {
		expect(isEmailFormatValid('test@example.com')).toBe(true);
	});

	it('invalidates incorrect emails', () => {
		expect(isEmailFormatValid('invalid-email')).toBe(false);
	});
});

describe('validateEmail', () => {
	const validData = {
		pseudo: 'JohnDoe',
		email: 'john@example.com',
		password: 'password123',
		password_confirm: 'password123'
	};

	it('returns null when data is valid and no form error', () => {
		expect(validateEmail(validData, null)).toBeNull();
	});

	it('returns email error for invalid email', () => {
		const data = { ...validData, email: 'invalid' };
		expect(validateEmail(data, null)).toBe("L'adresse mail n'est pas valide !");
	});

	it('returns pseudo error if password is too short', () => {
		const data = { ...validData, pseudo: 'a' };
		expect(validateEmail(data, null)).toBe("Pseudo trop court !");
	});

	it('returns mismatch error if passwords do not match', () => {
		const data = { ...validData, password_confirm: 'different123' };
		expect(validateEmail(data, null)).toBe("Les mots de passe ne correspondent pas !");
	});

	it('returns length error if password is too short', () => {
		const data = { ...validData, password: '123', password_confirm: '123' };
		expect(validateEmail(data, null)).toBe("Le mot de passe doit contenir plus de 7 caractères !");
	});

	it('returns server error from form prop', () => {
		expect(validateEmail(validData, { error: "Email already exists" })).toBe("Email already exists");
	});
});

describe('isFormValid', () => {
	it('returns true for completely valid data', () => {
		const data = {
			pseudo: 'JohnDoe',
			email: 'john@example.com',
			password: 'password123',
			password_confirm: 'password123'
		};
		expect(isFormValid(data)).toBe(true);
	});

	it('returns false if pseudo is empty or just spaces', () => {
		const data = {
			pseudo: '   ',
			email: 'john@example.com',
			password: 'password123',
			password_confirm: 'password123'
		};
		expect(isFormValid(data)).toBe(false);
	});

	it('returns false if passwords do not match', () => {
		const data = {
			pseudo: 'JohnDoe',
			email: 'john@example.com',
			password: 'password123',
			password_confirm: 'password456'
		};
		expect(isFormValid(data)).toBe(false);
	});
});

describe('isCodeAuthValid', () => {
	it('returns error when code is empty of spaces only', () => {
		expect(isCodeAuthValid('')).toBe("Le code de vérification ne peut pas être vide.");
		expect(isCodeAuthValid('	')).toBe("Le code de vérification ne peut pas être vide.");
	});
	it('returns error when code is not 6 characters', () => {
		expect(isCodeAuthValid('12345')).toBe("Le code de vérification doit contenir exactement 6 chiffres.");
		expect(isCodeAuthValid('1234567')).toBe("Le code de vérification doit contenir exactement 6 chiffres.");

	});
	it('returns error null when code is exactly 6 characters', () => {
		expect(isCodeAuthValid('789456')).toBeNull();
		expect(isCodeAuthValid('123456')).toBeNull();

	});
})

describe('emailConnexionTest', () => {
	it('returns error when email or password are empty of spaces only', () => {
		expect(emailConnexionTest('', '12345678')).toBe("Email ou mot de passe manquant");
		expect(emailConnexionTest('	', '12345678')).toBe("Email ou mot de passe manquant");
		expect(emailConnexionTest('test@hotmail.fr', '')).toBe("Email ou mot de passe manquant");
		expect(emailConnexionTest('test@hotmail.fr', '	')).toBe("Email ou mot de passe manquant");
		expect(emailConnexionTest('', '')).toBe("Email ou mot de passe manquant");
		expect(emailConnexionTest('	', '')).toBe("Email ou mot de passe manquant");
		expect(emailConnexionTest('', '	')).toBe("Email ou mot de passe manquant");
		expect(emailConnexionTest('	', '	')).toBe("Email ou mot de passe manquant");
	});
	it('returns error when email is more than 100 characters or if password is more than 50 characters', () => {
		expect(emailConnexionTest('123456789123456789123456789123456789123456789123456789123456789121234567891234567891234567891234567891234567891212345678912345678912345678912@hotmail.fr', '12345678')).toBe("Email ou mot de passe trop long !");
		expect(emailConnexionTest('test@hotmail.fr', '123456789123456789123456789123456789123456789123456789123456789121234567891234567891234567891234567891234567891212345678912345678912345678912')).toBe("Email ou mot de passe trop long !");

	});
	it('returns error for invalid email ', () => {
		expect(emailConnexionTest('test', '12345678')).toBe("Format de l'email non valide !");
		expect(emailConnexionTest('.fr', '12345678')).toBe("Format de l'email non valide !");
		expect(emailConnexionTest('@', '12345678')).toBe("Format de l'email non valide !");
		expect(emailConnexionTest('@.fr', '12345678')).toBe("Format de l'email non valide !");
		expect(emailConnexionTest('test@', '12345678')).toBe("Format de l'email non valide !");
		expect(emailConnexionTest('test.fr', '12345678')).toBe("Format de l'email non valide !");

	});
	it('return error if password is less than 8 characters', () => {
		expect(emailConnexionTest('test@hotmail.fr', '1234567')).toBe("Le mot de passe doit contenir plus de 7 caractères !");
		expect(emailConnexionTest('test@hotmail.fr', '1')).toBe("Le mot de passe doit contenir plus de 7 caractères !");
	});
	it('return error null when email and password are ok', () => {
		expect(emailConnexionTest('test@hotmail.fr', '12345678')).toBeNull();
		expect(emailConnexionTest('test2@hotmail.fr', '098765432101')).toBeNull();
	});
})

describe('forgotTest', () => {
	it('return error if forgot email is empty of spaces only', () => {
		expect(forgotTest('')).toBe("Email manquant !");
		expect(forgotTest('	')).toBe("Email manquant !");
	});
	it('returns error when email is more than 100 characters', () => {
		expect(forgotTest('123456789123456789123456789123456789123456789123456789123456789121234567891234567891234567891234567891234567891212345678912345678912345678912@hotmail.fr')).toBe("Email trop long !");
	});
	it('returns error for invalid email ', () => {
		expect(forgotTest('test')).toBe("Format de l'email non valide !");
		expect(forgotTest('.fr')).toBe("Format de l'email non valide !");
		expect(forgotTest('@')).toBe("Format de l'email non valide !");
		expect(forgotTest('@.fr')).toBe("Format de l'email non valide !");
		expect(forgotTest('test@')).toBe("Format de l'email non valide !");
		expect(forgotTest('test.fr')).toBe("Format de l'email non valide !");

	});
	it('returns errornull when email is ok', () => {
		expect(forgotTest('test@hotmail.fr')).toBeNull();
	});
})

describe('resetPasswordTest', () => {
	it('return error if password or password_confirm are empty of spaces only', () => {
		expect(resetPasswordTest('', '12345678')).toBe("Au moins un element est vide !");
		expect(resetPasswordTest('12345678', '')).toBe("Au moins un element est vide !");
		expect(resetPasswordTest('	', '12345678')).toBe("Au moins un element est vide !");
		expect(resetPasswordTest('12345678', '	')).toBe("Au moins un element est vide !");
		expect(resetPasswordTest('', '')).toBe("Au moins un element est vide !");
		expect(resetPasswordTest('	', '')).toBe("Au moins un element est vide !");
		expect(resetPasswordTest('', '	')).toBe("Au moins un element est vide !");
		expect(resetPasswordTest('	', '	')).toBe("Au moins un element est vide !");
	});
	it('return error if password and password_confirm are not the same', () => {
		expect(resetPasswordTest('123456789', '12345678')).toBe("Les mots de passe ne correspondent pas !");
		expect(resetPasswordTest('12345678', '123456789')).toBe("Les mots de passe ne correspondent pas !");
		expect(resetPasswordTest('879817918987', '98797987198')).toBe("Les mots de passe ne correspondent pas !");
	});
	it('return error if password or password_confirm are less than 7 characters', () => {
		expect(resetPasswordTest('1234567', '1234567')).toBe("Le mot de passe doit contenir plus de 7 caractères !");
		expect(resetPasswordTest('2', '2')).toBe("Le mot de passe doit contenir plus de 7 caractères !");
	});
	it('return error if password or password_confirm are more than 50 characters', () => {
		expect(resetPasswordTest('48944184647242727219782187212742197219721924957985497212721972172912792174297212712712972197219721974972972', '48944184647242727219782187212742197219721924957985497212721972172912792174297212712712972197219721974972972')).toBe("Mot de passe trop long !");
	});
	it('return error null when password and password_confirm are ok and the same', () => {
		expect(resetPasswordTest('12345678', '12345678')).toBeNull();
		expect(resetPasswordTest('helloworld42', 'helloworld42')).toBeNull();
	});
})

