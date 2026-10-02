import { describe, it, expect, vi } from 'vitest';
import { sendMail } from './email';
import nodemailer from 'nodemailer';

//------- mock the nodemailer module to prevent real network requests during tests
vi.mock('nodemailer', () => ({
    //------- real network nodemailer package use default
    default: {
        //------- mock createTransport function and return fake transporter object
        createTransport: vi.fn().mockReturnValue({
            //------- mock sendMail method inside the transporter, resolving successfully with a fake message Id
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id-123' })
        })
    }
}));

describe('sendMail', () => {

    it('must call nodemailer with goods param et send email', async () => {
        const recipient = 'test@test.fr';
        const object = 'Test Object';
        const text = 'Message Test';

        const result = await sendMail(recipient, object, text);

        //------- Assert that createTransport was called with the correct SMTP configuration settings
        expect(nodemailer.createTransport).toHaveBeenCalledWith(
            //------- Use objectContaining to check specific properties without needing an exact match for everything
            expect.objectContaining({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
            })
        );

        //------- Retrieve the fake transporter instance returned by the first call to createTransport
        const objectInMail = (nodemailer.createTransport as any).mock.results[0].value;

        //------- Assert that the inner sendMail method was invoked exactly one time
        expect(objectInMail.sendMail).toHaveBeenCalledTimes(1);

        //------- Assert that sendMail received the exact expected payload (sender, recipient, subject, text)
        expect(objectInMail.sendMail).toHaveBeenCalledWith({
            from: '"Rappeltout" <rappeltout42@gmail.com>',
            to: recipient,
            subject: object,
            text: text
        });

        //------- Assert that the function successfully returns the expected mock resolution object
        expect(result).toEqual({ messageId: 'test-id-123'});

    });
});