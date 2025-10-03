CREATE TABLE IF NOT EXISTS todo_labels (
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (todo_id, label_id)
);

CREATE INDEX idx_labels_board_id ON labels(board_id);
CREATE INDEX idx_todo_labels_todo_id ON todo_labels(todo_id);
CREATE INDEX idx_todo_labels_label_id ON todo_labels(label_id);
