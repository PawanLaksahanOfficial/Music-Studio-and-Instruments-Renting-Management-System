import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { CookieOptions, Response } from 'express';
import { env, isProd } from '../config/env';
import { Role } from '../config/constants';

export const SESSION_COOKIE = 'elvi_session';
const ISSUER = 'elvi-api';
const AUDIENCE = 'elvi-web';

export interface SessionClaims extends JwtPayload {
    sub: string;
    role: Role;
    /** tokenVersion of the user when the token was issued. */
    tv: number;
}

interface TokenSubject {
    _id: { toString(): string };
    role: Role;
    tokenVersion: number;
}

export const signSessionToken = (user: TokenSubject): string =>
    jwt.sign({ role: user.role, tv: user.tokenVersion }, env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
        subject: user._id.toString(),
        issuer: ISSUER,
        audience: AUDIENCE,
    });

/** Verifies signature, algorithm, issuer, audience and expiry. Throws if any check fails. */
export const verifySessionToken = (token: string): SessionClaims => {
    const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
    });
    if (typeof payload === 'string' || !payload.sub || typeof payload.tv !== 'number') {
        throw new Error('Malformed session token');
    }
    return payload as SessionClaims;
};

const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api',
};

/** Stores the session token in an httpOnly cookie that JavaScript (and therefore XSS) cannot read. */
export const setSessionCookie = (res: Response, token: string) => {
    const { exp } = jwt.decode(token) as JwtPayload;
    res.cookie(SESSION_COOKIE, token, {
        ...baseCookieOptions,
        maxAge: exp ? exp * 1000 - Date.now() : undefined,
    });
};

export const clearSessionCookie = (res: Response) => res.clearCookie(SESSION_COOKIE, baseCookieOptions);
