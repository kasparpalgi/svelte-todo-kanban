-- Check and hash passwords in Postgres (pgcrypto) so the app needs no bcryptjs (#217).
-- bcryptjs writes `$2b$` hashes; pgcrypto only reads `$2a$`, which is the same algorithm.
-- Both tracked functions are VOLATILE so Hasura exposes them as mutations, which never get
-- inferred role permissions: admin only. A STABLE one would let anonymous callers test passwords.

CREATE OR REPLACE FUNCTION public.hash_password(plain text)
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT public.crypt(plain, public.gen_salt('bf', 10));
$$;

CREATE OR REPLACE FUNCTION public.verify_user_password(user_email text, user_password text)
RETURNS SETOF public.users LANGUAGE sql VOLATILE AS $$
  SELECT u.* FROM public.users u
  WHERE u.email = user_email
    AND u.password LIKE '$2_$%'
    AND public.crypt(user_password, '$2a$' || substr(u.password, 5)) = '$2a$' || substr(u.password, 5)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.create_password_user(user_email text, user_name text, user_password text)
RETURNS SETOF public.users LANGUAGE sql VOLATILE AS $$
  INSERT INTO public.users (email, name, password)
  VALUES (user_email, user_name, public.hash_password(user_password))
  RETURNING *;
$$;
