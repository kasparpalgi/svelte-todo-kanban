import { APP_ENV } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

if (env.APP_ENV !== 'development') {
	//throw redirect(302, '/en');
}
