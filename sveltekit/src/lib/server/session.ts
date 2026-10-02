import { prisma } from '$lib/server/prisma'
import { randomUUID } from 'crypto';
import type { Cookies } from '@sveltejs/kit';

/**
 * @file session.ts
 * @brief Cleans up and deletes all expired user sessions from the database.
 * 
 * This asynchronous utility function queries the database to remove any session 
 * where the expiration date (`endedAt`) has passed compared to the current time.
 * 
 */
export async function cleanExpiredSessions()
{
    await prisma.session.deleteMany({
        where : {endedAt : {lt: new Date()}}
    });
}

/**
 * @brief Creates a new user session in the database and sets an encrypted session cookie in the browser.
 * 
 * This function generates a unique session ID using `randomUUID`, cleans up old expired sessions, 
 * persists the new session with a 24-hour expiration lifespan in the database via Prisma, and finally 
 * attaches a secure, HTTP-only cookie to the response cookies.
 */
export async function createSessionAndCookie(userId: number, cookies: Cookies, sameSite : 'strict' | 'lax' = 'strict')
{
    //------- generate a unique session ID
    const sessionId = randomUUID(); //random Id

    //------- delete expired session in DB
    await cleanExpiredSessions();

    //------- save session in DB
    await prisma.session.create
    ({
        data:
        {
            id: sessionId,
            userId: userId,
            endedAt: new Date(Date.now() + 60 * 60 * 24 * 1000) // 24 hours
        }
    })

    //------- send to browser with Cookie : From now on, every time the browser calls your server, it will automatically send this token in the request headers.
    cookies.set('session', sessionId,
        {
            path: '/', // this cookie is valid for the entire site
            httpOnly: true, // security : when true, the cookie is invisible to the JavaScript running in your browser.
            sameSite: sameSite,
            secure: true, // security : send cookie only if its https and not http
            maxAge: 60 * 60 * 24 // cookie liftime
        }
    );
}