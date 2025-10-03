-- Make token column nullable so Hasura knows it's optional (trigger will set it)
ALTER TABLE board_invitations
  ALTER COLUMN token DROP NOT NULL;