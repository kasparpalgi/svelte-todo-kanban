CREATE TRIGGER "auto_generate_invitation_token"
BEFORE INSERT ON "public"."board_invitations"
FOR EACH ROW EXECUTE FUNCTION set_invitation_token();
