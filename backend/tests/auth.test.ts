import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import authService from '../services/authService';
import User from '../models/User';
import { makeUser, tokenFor } from './helpers';

const app = createApp();

describe('POST /api/auth/login', () => {
    it('issues a token for valid credentials', async () => {
        await makeUser({ username: 'alice', password: 'CorrectHorse9' });

        const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'CorrectHorse9' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user.username).toBe('alice');
    });

    it('never returns the password hash', async () => {
        await makeUser({ username: 'bob', password: 'CorrectHorse9' });
        const res = await request(app).post('/api/auth/login').send({ username: 'bob', password: 'CorrectHorse9' });
        expect(JSON.stringify(res.body)).not.toContain('$2');
    });

    it('gives the same message for a wrong password and an unknown user', async () => {
        await makeUser({ username: 'carol', password: 'CorrectHorse9' });

        const wrongPassword = await request(app)
            .post('/api/auth/login')
            .send({ username: 'carol', password: 'WrongPassword1' });
        const noSuchUser = await request(app)
            .post('/api/auth/login')
            .send({ username: 'nobody', password: 'WrongPassword1' });

        // Distinct messages would let an attacker enumerate valid usernames.
        expect(wrongPassword.status).toBe(401);
        expect(noSuchUser.status).toBe(401);
        expect(wrongPassword.body.message).toBe(noSuchUser.body.message);
    });

    it('refuses a deactivated account', async () => {
        await makeUser({ username: 'dave', password: 'CorrectHorse9', isActive: false });
        const res = await request(app).post('/api/auth/login').send({ username: 'dave', password: 'CorrectHorse9' });
        expect(res.status).toBe(403);
    });

    it('rejects a request with no body', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Validation failed');
    });
});

describe('protected routes', () => {
    it('rejects a request with no token', async () => {
        const res = await request(app).get('/api/inventory');
        expect(res.status).toBe(401);
    });

    it('rejects a malformed token', async () => {
        const res = await request(app).get('/api/inventory').set('Authorization', 'Bearer not-a-real-token');
        expect(res.status).toBe(401);
    });

    it('accepts a valid token', async () => {
        const user = await makeUser();
        const res = await request(app).get('/api/inventory').set('Authorization', `Bearer ${tokenFor(user)}`);
        expect(res.status).toBe(200);
    });

    it('blocks a Cashier from an admin-only route', async () => {
        const cashier = await makeUser({ role: 'Cashier' });
        const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokenFor(cashier)}`);
        expect(res.status).toBe(403);
    });
});

describe('password change', () => {
    it('requires the current password', async () => {
        const user = await makeUser({ password: 'CorrectHorse9' });

        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send({ currentPassword: 'TotallyWrong1', newPassword: 'BrandNewPass7' });

        expect(res.status).toBe(401);
    });

    it('enforces the password policy on the new password', async () => {
        const user = await makeUser({ password: 'CorrectHorse9' });

        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send({ currentPassword: 'CorrectHorse9', newPassword: 'short' });

        expect(res.status).toBe(400);
    });

    it('changes the password and lets the new one log in', async () => {
        const user = await makeUser({ username: 'erin', password: 'CorrectHorse9' });

        const change = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send({ currentPassword: 'CorrectHorse9', newPassword: 'BrandNewPass7' });
        expect(change.status).toBe(200);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ username: 'erin', password: 'BrandNewPass7' });
        expect(login.status).toBe(200);
    });

    it('invalidates tokens issued before the change', async () => {
        const user = await makeUser({ username: 'frank', password: 'CorrectHorse9' });
        const oldToken = tokenFor(user);

        await authService.changePassword(String(user._id), 'CorrectHorse9', 'BrandNewPass7');

        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${oldToken}`);
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Password was changed/);
    });
});

describe('user administration', () => {
    it('never accepts a password on the update endpoint', async () => {
        const admin = await makeUser({ role: 'Admin' });
        const target = await makeUser({ username: 'target', password: 'CorrectHorse9' });

        await request(app)
            .patch(`/api/users/${target._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ name: 'Renamed', password: 'HijackedPass1' });

        // The password field is stripped by the schema, so the original still works.
        const login = await request(app)
            .post('/api/auth/login')
            .send({ username: 'target', password: 'CorrectHorse9' });
        expect(login.status).toBe(200);
    });

    it('refuses to delete the last active administrator', async () => {
        const admin = await makeUser({ role: 'Admin' });
        const other = await makeUser({ role: 'Admin' });

        // Deleting one of two admins is fine.
        const first = await request(app)
            .delete(`/api/users/${other._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);
        expect(first.status).toBe(200);

        // The remaining admin cannot delete themselves.
        const second = await request(app)
            .delete(`/api/users/${admin._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);
        expect(second.status).toBe(400);
    });

    it('creates users with mustChangePassword set', async () => {
        const admin = await makeUser({ role: 'Admin' });

        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ name: 'New Cashier', username: 'newcashier', password: 'TempPassword1', role: 'Cashier' });

        expect(res.status).toBe(201);
        expect(res.body.mustChangePassword).toBe(true);
        expect(res.body.password).toBeUndefined();
    });
});

describe('User model', () => {
    it('excludes the password from ordinary queries', async () => {
        await makeUser({ username: 'grace' });
        const found = await User.findOne({ username: 'grace' });
        expect(found!.password).toBeUndefined();
    });

    it('stores a bcrypt hash rather than the plaintext', async () => {
        await makeUser({ username: 'heidi', password: 'CorrectHorse9' });
        const found = await User.findOne({ username: 'heidi' }).select('+password');
        expect(found!.password).not.toBe('CorrectHorse9');
        expect(found!.password.startsWith('$2')).toBe(true);
    });
});
