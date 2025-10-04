CREATE OR REPLACE FUNCTION create_user_board()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO boards (user_id, name)
  VALUES (
    NEW.id,
    INITCAP(NEW.username) || '''s board'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_board
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_board();
