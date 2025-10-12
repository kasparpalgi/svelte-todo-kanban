/** @file src/routes/signout/+page.server.ts */
import { signOut } from '../../hooks.server';
import type { Actions } from './$types';

export const actions: Actions = {
	default: signOut
};
