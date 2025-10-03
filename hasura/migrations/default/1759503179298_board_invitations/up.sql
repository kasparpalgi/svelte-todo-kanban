CREATE TABLE board_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255),
  invitee_username VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('editor', 'viewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  CONSTRAINT invitation_has_invitee CHECK (
    invitee_email IS NOT NULL OR invitee_username IS NOT NULL
  )
);

CREATE INDEX idx_board_invitations_board_id ON board_invitations(board_id);
CREATE INDEX idx_board_invitations_inviter_id ON board_invitations(inviter_id);
CREATE INDEX idx_board_invitations_invitee_email ON board_invitations(invitee_email);
CREATE INDEX idx_board_invitations_invitee_username ON board_invitations(invitee_username);
CREATE INDEX idx_board_invitations_token ON board_invitations(token);
CREATE INDEX idx_board_invitations_status ON board_invitations(status);

CREATE TRIGGER set_board_invitations_updated_at
  BEFORE UPDATE ON board_invitations
  FOR EACH ROW
  EXECUTE PROCEDURE set_current_timestamp_updated_at();
