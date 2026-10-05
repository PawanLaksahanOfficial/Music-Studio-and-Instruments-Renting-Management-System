import { AuthUser } from '../interfaces/IUser';

declare global {
    namespace Express {
        interface Request {
            /** Set by the `authenticate` middleware for signed-in requests. */
            user?: AuthUser;
        }
    }
}

export {};
