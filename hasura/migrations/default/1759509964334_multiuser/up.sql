SET check_function_bodies = false;
CREATE OR REPLACE FUNCTION public.add_board_creator_as_owner() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO board_members (board_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.generate_invitation_token() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;
CREATE OR REPLACE FUNCTION public.generate_unique_alias(name_input text) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    base_alias TEXT;
    final_alias TEXT;
    max_existing_number INTEGER := 0;
BEGIN
    -- Lowercase URL-friendly alias
    base_alias := LOWER(name_input);
    -- Replace spaces with hyphens
    base_alias := REPLACE(base_alias, ' ', '-');
    -- Remove bad chars
    base_alias := REGEXP_REPLACE(base_alias, '[^a-z0-9\-_]', '', 'g');
    -- Multiple consec. hyphens > single hyphen
    base_alias := REGEXP_REPLACE(base_alias, '-+', '-', 'g');
    -- Remove leading/trailing hyphens
    base_alias := TRIM(BOTH '-' FROM base_alias);
    -- Empty after cleaning?
    IF LENGTH(base_alias) = 0 THEN
        base_alias := 'board';
    END IF;
    -- Check if base available
    IF NOT EXISTS (SELECT 1 FROM boards WHERE alias = base_alias) THEN
        RETURN base_alias;
    END IF;
    -- Find highest number suffix
    SELECT COALESCE(MAX(
        CASE 
            WHEN alias ~ ('^' || base_alias || '[0-9]+$') 
            THEN CAST(SUBSTRING(alias FROM (LENGTH(base_alias) + 1)) AS INTEGER)
            ELSE 0
        END
    ), 0) INTO max_existing_number
    FROM boards 
    WHERE alias ~ ('^' || base_alias || '[0-9]*$');
    -- Generate next available
    final_alias := base_alias || (max_existing_number + 1);
    RETURN final_alias;
END;
$_$;
CREATE OR REPLACE FUNCTION public.generate_unique_alias_for_user_todo(name_input text, user_id_input uuid) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
  base_alias TEXT;
  final_alias TEXT;
  max_existing_number INTEGER := 0;
BEGIN
  base_alias := LOWER(name_input);
  base_alias := REPLACE(base_alias, ' ', '-');
  base_alias := REGEXP_REPLACE(base_alias, '[^a-z0-9\-_]', '', 'g');
  base_alias := REGEXP_REPLACE(base_alias, '-+', '-', 'g');
  base_alias := TRIM(BOTH '-' FROM base_alias);
  IF LENGTH(base_alias) = 0 THEN
    base_alias := 'todo';
  END IF;
  -- Check if available FOR THIS USER
  IF NOT EXISTS (
    SELECT 1 FROM todos 
    WHERE alias = base_alias AND user_id = user_id_input
  ) THEN
    RETURN base_alias;
  END IF;
  -- Find highest number suffix FOR THIS USER
  SELECT COALESCE(MAX(
    CASE
      WHEN alias ~ ('^' || base_alias || '[0-9]+$')
      THEN CAST(SUBSTRING(alias FROM (LENGTH(base_alias) + 1)) AS INTEGER)
      ELSE 0
    END
  ), 0) INTO max_existing_number
  FROM todos
  WHERE user_id = user_id_input 
    AND alias ~ ('^' || base_alias || '[0-9]*$');
  final_alias := base_alias || (max_existing_number + 1);
  RETURN final_alias;
END;
$_$;
CREATE OR REPLACE FUNCTION public.generate_unique_username(email_input text) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 1;
    max_existing_number INTEGER := 0;
BEGIN
    -- Get everything before @ from email
    base_username := LOWER(SPLIT_PART(email_input, '@', 1));
    -- Check if username is available
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = base_username) THEN
        RETURN base_username;
    END IF;
    -- Find highest existing number suffix
    SELECT COALESCE(MAX(
        CASE 
            WHEN username ~ ('^' || base_username || '[0-9]+$') 
            THEN CAST(SUBSTRING(username FROM (LENGTH(base_username) + 1)) AS INTEGER)
            ELSE 0
        END
    ), 0) INTO max_existing_number
    FROM users 
    WHERE username ~ ('^' || base_username || '[0-9]*$');
    -- Generate next available username
    final_username := base_username || (max_existing_number + 1);
    RETURN final_username;
END;
$_$;
CREATE OR REPLACE FUNCTION public.set_alias_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Generate alias if not provided
    IF NEW.alias IS NULL OR NEW.alias = '' THEN
        NEW.alias := generate_unique_alias(NEW.name);
    END IF;
    RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE OR REPLACE FUNCTION public.set_invitation_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.set_todo_alias() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.alias := generate_unique_alias_for_user_todo(NEW.title, NEW.user_id);
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.set_username_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Generate username if we don't have it (just in case in future needed)
    IF NEW.username IS NULL OR NEW.username = '' THEN
        NEW.username := generate_unique_username(NEW.email);
    END IF;
    RETURN NEW;
END;
$$;
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(255) NOT NULL,
    provider character varying(255) NOT NULL,
    "providerAccountId" character varying(255) NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type character varying(255),
    scope character varying(255),
    id_token text,
    session_state character varying(255),
    "userId" uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.board_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    inviter_id uuid NOT NULL,
    invitee_email character varying(255),
    invitee_username character varying(255),
    role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    token character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    CONSTRAINT board_invitations_role_check CHECK (((role)::text = ANY ((ARRAY['editor'::character varying, 'viewer'::character varying])::text[]))),
    CONSTRAINT board_invitations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT invitation_has_invitee CHECK (((invitee_email IS NOT NULL) OR (invitee_username IS NOT NULL)))
);
COMMENT ON TABLE public.board_invitations IS 'Tracks pending and processed invitations to boards';
COMMENT ON COLUMN public.board_invitations.role IS 'Role to assign when invitation is accepted (editor/viewer, not owner)';
COMMENT ON COLUMN public.board_invitations.status IS 'pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled';
COMMENT ON COLUMN public.board_invitations.token IS 'Secure token for invitation links';
CREATE TABLE IF NOT EXISTS public.board_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT board_members_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'editor'::character varying, 'viewer'::character varying])::text[])))
);
COMMENT ON TABLE public.board_members IS 'Tracks board membership and user roles (owner/editor/viewer)';
COMMENT ON COLUMN public.board_members.role IS 'User role: owner (full control), editor (can modify), viewer (read-only)';
CREATE TABLE IF NOT EXISTS public.boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    alias text NOT NULL,
    github text,
    is_public boolean DEFAULT false NOT NULL,
    allow_public_comments boolean DEFAULT false NOT NULL
);
COMMENT ON COLUMN public.boards.is_public IS 'When true, board is viewable by anyone (read-only unless member)';
COMMENT ON COLUMN public.boards.allow_public_comments IS 'When true and is_public=true, non-members can comment on todos';
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    todo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.labels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    board_id uuid
);
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "sessionToken" character varying(255) NOT NULL,
    "userId" uuid NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.todo_labels (
    todo_id uuid NOT NULL,
    label_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.todos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    list_id uuid,
    title text NOT NULL,
    content text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    due_on timestamp with time zone,
    sort_order integer DEFAULT 1 NOT NULL,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    alias text NOT NULL,
    CONSTRAINT priority CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text])))
);
CREATE TABLE IF NOT EXISTS public.uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    todo_id uuid NOT NULL,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255),
    email character varying(255),
    "emailVerified" timestamp with time zone,
    image text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    locale character varying DEFAULT 'en'::character varying NOT NULL,
    dark_mode boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{"defaultView": "kanban"}'::jsonb NOT NULL,
    username text NOT NULL,
    default_labels jsonb DEFAULT '[]'::jsonb
);
CREATE TABLE IF NOT EXISTS public.verification_tokens (
    identifier character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_provider_provideraccountid_key UNIQUE (provider, "providerAccountId");
ALTER TABLE ONLY public.board_invitations
    ADD CONSTRAINT board_invitations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.board_invitations
    ADD CONSTRAINT board_invitations_token_key UNIQUE (token);
ALTER TABLE ONLY public.board_members
    ADD CONSTRAINT board_members_board_user_unique UNIQUE (board_id, user_id);
ALTER TABLE ONLY public.board_members
    ADD CONSTRAINT board_members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_alias_key UNIQUE (alias);
ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_sessiontoken_key UNIQUE ("sessionToken");
ALTER TABLE ONLY public.todo_labels
    ADD CONSTRAINT todo_labels_pkey PRIMARY KEY (todo_id, label_id);
ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_user_id_alias_unique UNIQUE (user_id, alias);
ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token);
CREATE INDEX idx_board_invitations_board_id ON public.board_invitations USING btree (board_id);
CREATE INDEX idx_board_invitations_invitee_email ON public.board_invitations USING btree (invitee_email);
CREATE INDEX idx_board_invitations_invitee_username ON public.board_invitations USING btree (invitee_username);
CREATE INDEX idx_board_invitations_inviter_id ON public.board_invitations USING btree (inviter_id);
CREATE INDEX idx_board_invitations_status ON public.board_invitations USING btree (status);
CREATE INDEX idx_board_invitations_token ON public.board_invitations USING btree (token);
CREATE INDEX idx_board_members_board_id ON public.board_members USING btree (board_id);
CREATE INDEX idx_board_members_role ON public.board_members USING btree (role);
CREATE INDEX idx_board_members_user_id ON public.board_members USING btree (user_id);
CREATE INDEX idx_boards_is_public ON public.boards USING btree (is_public) WHERE (is_public = true);
CREATE INDEX idx_comments_created_at ON public.comments USING btree (created_at DESC);
CREATE INDEX idx_comments_todo_id ON public.comments USING btree (todo_id);
CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);
CREATE INDEX idx_labels_board_id ON public.labels USING btree (board_id);
CREATE INDEX idx_todo_labels_label_id ON public.todo_labels USING btree (label_id);
CREATE INDEX idx_todo_labels_todo_id ON public.todo_labels USING btree (todo_id);
CREATE TRIGGER auto_generate_invitation_token BEFORE INSERT ON public.board_invitations FOR EACH ROW EXECUTE FUNCTION public.set_invitation_token();
CREATE TRIGGER board_creator_as_owner AFTER INSERT ON public.boards FOR EACH ROW EXECUTE FUNCTION public.add_board_creator_as_owner();
CREATE TRIGGER set_board_invitations_updated_at BEFORE UPDATE ON public.board_invitations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_board_members_updated_at BEFORE UPDATE ON public.board_members FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_public_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_boards_updated_at ON public.boards IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_lists_updated_at ON public.lists IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_todos_updated_at ON public.todos IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_todo_alias_trigger BEFORE INSERT ON public.todos FOR EACH ROW WHEN ((new.alias IS NULL)) EXECUTE FUNCTION public.set_todo_alias();
CREATE TRIGGER trigger_set_alias BEFORE INSERT ON public.boards FOR EACH ROW EXECUTE FUNCTION public.set_alias_on_insert();
CREATE TRIGGER trigger_set_username BEFORE INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_username_on_insert();
ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_userid_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_invitations
    ADD CONSTRAINT board_invitations_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_invitations
    ADD CONSTRAINT board_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_members
    ADD CONSTRAINT board_members_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.board_members
    ADD CONSTRAINT board_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_userid_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.todo_labels
    ADD CONSTRAINT todo_labels_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.labels(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.todo_labels
    ADD CONSTRAINT todo_labels_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id) ON UPDATE CASCADE ON DELETE CASCADE;
