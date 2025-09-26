import { PUBLIC_APP_ENV } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

if (PUBLIC_APP_ENV !== 'development') {
	throw redirect(302, '/en');
}
