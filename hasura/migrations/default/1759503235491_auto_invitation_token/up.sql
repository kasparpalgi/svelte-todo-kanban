CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_invitation_token
  BEFORE INSERT ON board_invitations
  FOR EACH ROW
  EXECUTE PROCEDURE set_invitation_token();

COMMENT ON TABLE board_invitations IS 'Tracks pending and processed invitations to boards';
COMMENT ON COLUMN board_invitations.role IS 'Role to assign when invitation is accepted (editor/viewer, not owner)';
COMMENT ON COLUMN board_invitations.status IS 'pending: awaiting response, accepted: user joined, declined: user rejected, cancelled: inviter cancelled';
COMMENT ON COLUMN board_invitations.token IS 'Secure token for invitation links';
