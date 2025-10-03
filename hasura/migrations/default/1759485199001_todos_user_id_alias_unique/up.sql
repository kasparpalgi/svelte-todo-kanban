ALTER TABLE todos
ADD CONSTRAINT todos_user_id_alias_unique UNIQUE (user_id, alias);
