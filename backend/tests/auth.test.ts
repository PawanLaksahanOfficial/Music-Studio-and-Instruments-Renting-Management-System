import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import User from '../models/User';
import { app, createUser, PASSWORD, signIn, useDatabase, xhr } from './helpers';

useDatabase('auth_tests');

describe('authentication', () => {
    beforeAll(async () => {
        await createUser('admin', 'Admin');
        await createUser('cashier', 'Cashier');
    });

    it('sets an httpOnly, SameSite=Strict session cookie and returns no token in the body', async () => {
        const res = await request(app).post('/api/auth/login').set(xhr).send({ username: 'ADMIN ', password: PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ username: 'admin', role: 'Admin' });
        expect(res.body.token).toBeUndefined();
        expect(res.body.user.password).toBeUndefined();
        const cookie = res.headers['set-cookie'][0];
        expect(cookie).toMatch(/^elvi_session=/);
        expect(cookie).toMatch(/HttpOnly/);
        expect(cookie).toMatch(/SameSite=Strict/);
        expect(cookie).toMatch(/Path=\/api/);
    });

    it('returns the same generic error for a wrong password and an unknown user', async () => {
        const wrong = await request(app).post('/api/auth/login').set(xhr).send({ username: 'admin', password: 'nope-nope-1' });
        const unknown = await request(app).post('/api/auth/login').set(xhr).send({ username: 'ghost', password: 'nope-nope-1' });

        expect(wrong.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('rejects NoSQL operator injection in the login body', async () => {
        const res = await request(app).post('/api/auth/login').set(xhr).send({ username: { $ne: null }, password: { $ne: null } });
        expect(res.status).toBe(400);
    });

    it('rejects state-changing requests without the anti-CSRF header', async () => {
        const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: PASSWORD });
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('CSRF_REJECTED');
    });

    it('sends security headers and a request id', async () => {
        const res = await request(app).get('/healthz');
        expect(res.headers['content-security-policy']).toContain("default-src 'self'");
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-powered-by']).toBeUndefined();
        expect(res.headers['x-request-id']).toBeTruthy();
    });

    it('revokes the session on logout, even if the old cookie is replayed', async () => {
        const agent = await signIn('admin');
        const login = await request(app).post('/api/auth/login').set(xhr).send({ username: 'admin', password: PASSWORD });
        const oldCookie = login.headers['set-cookie'][0].split(';')[0];

        expect((await agent.get('/api/auth/me')).status).toBe(200);
        expect((await agent.post('/api/auth/logout').set(xhr)).status).toBe(204);

        const replay = await request(app).get('/api/auth/me').set('Cookie', oldCookie);
        expect(replay.status).toBe(401);
    });

    it('signs out a user as soon as an admin deactivates them', async () => {
        await createUser('temp', 'Cashier');
        const temp = await signIn('temp');
        const admin = await signIn('admin');
        const tempUser = await User.findOne({ username: 'temp' });

        await admin.patch(`/api/users/${tempUser!.id}/toggle-active`).set(xhr).expect(200);
        expect((await temp.get('/api/customers')).status).toBe(401);
    });

    it('forces a password change before business routes can be used', async () => {
        await createUser('newbie', 'Cashier', { mustChangePassword: true });
        const agent = await signIn('newbie');

        const blocked = await agent.get('/api/customers');
        expect(blocked.status).toBe(403);
        expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');

        const weak = await agent.patch('/api/auth/password').set(xhr).send({ currentPassword: PASSWORD, newPassword: 'short' });
        expect(weak.status).toBe(400);

        const changed = await agent.patch('/api/auth/password').set(xhr).send({ currentPassword: PASSWORD, newPassword: 'BrandNew2026' });
        expect(changed.status).toBe(200);
        expect((await agent.get('/api/customers')).status).toBe(200);
    });

    it('keeps cashiers out of admin-only routes', async () => {
        const cashier = await signIn('cashier');
        expect((await cashier.get('/api/users')).status).toBe(403);
        expect((await cashier.get('/api/stats/summary')).status).toBe(403);
    });

    it('returns 400 (not 500) for malformed ids and hides internals', async () => {
        const admin = await signIn('admin');
        const res = await admin.get('/api/customers/not-an-id');
        expect(res.status).toBe(400);
        expect(res.body.requestId).toBeTruthy();
    });

    it('rate limits repeated failed logins for an account', async () => {
        const attempt = () => request(app).post('/api/auth/login').set(xhr).send({ username: 'cashier', password: 'wrong-pass-1' });
        for (let i = 0; i < 10; i += 1) expect((await attempt()).status).toBe(401);
        const blocked = await attempt();
        expect(blocked.status).toBe(429);
        expect(blocked.body.code).toBe('RATE_LIMITED');
    });
});
