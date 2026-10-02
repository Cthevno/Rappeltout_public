import nodemailer from 'nodemailer';

/**
 * @brief Configures the SMTP transporter using Gmail's service.
 * * Sets up a Nodemailer transporter instance with the necessary authentication
 * credentials retrieved from environment variables. This allows the application
 * to connect to the SMTP server for outgoing emails.
 * * - host: 'smtp.gmail.com' - The address of the SMTP server provided by Google.
 * - port: 587 - The standard port for submission; it is typically used with STARTTLS.
 * - secure: false - Must be false for port 587, as it uses STARTTLS to upgrade an 
 * insecure connection to a secure one, rather than starting with SSL/TLS from the beginning.
 * - auth.user: The email address used to authenticate with the SMTP server.
 * - auth.pass: The application-specific password (or account password) used to 
 * authorize the connection.
 */
const transporter = nodemailer.createTransport
({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth:
    {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


/**
 * @brief Sends an email to a specified recipient via the SMTP transporter.
 * * This function takes the recipient's email address, the email subject, and the
 * message body as parameters. It leverages the transporter instance to deliver 
 * the email from the application's official address ("Rappeltout").
 * - recipient : The target email address.
 * - object : The subject line of the email.
 * - text : The content/body of the email.
 */
export async function sendMail(recipient: string, object: string, text: string)
{
    return await transporter.sendMail
    ({
        from: '"Rappeltout" <rappeltout42@gmail.com>',
        to:recipient,
        subject: object,
        text: text
    });
}