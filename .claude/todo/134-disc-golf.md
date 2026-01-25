CREATE TABLE game_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  min_players INTEGER DEFAULT 4,
  status VARCHAR(50) DEFAULT 'open', -- open, confirmed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, time)
);

-- Player availability declarations (e.g., "I want to play 3 times during my holiday")
CREATE TABLE player_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  desired_games INTEGER NOT NULL,
  min_games INTEGER NOT NULL, -- eg. 30€
  stripe_payment_intent_id VARCHAR(255), -- for the eg. 30€ hold
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, authorized, captured, failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Player availability for specific dates
CREATE TABLE player_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_trip_id UUID REFERENCES player_trips(id) ON DELETE CASCADE,
  game_date_id UUID REFERENCES game_dates(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'available', -- available, confirmed
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_trip_id, game_date_id)
);

-- When 4+ players are available
CREATE TABLE confirmed_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_date_id UUID REFERENCES game_dates(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Players assigned to confirmed games
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_availability_id UUID REFERENCES player_availability(id) ON DELETE CASCADE,
  charge_amount INTEGER DEFAULT 1000, -- 10€ in cents
  stripe_charge_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, player_availability_id)
);

-- Transaction log for payment tracking
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_trip_id UUID REFERENCES player_trips(id),
  game_player_id UUID REFERENCES game_players(id),
  transaction_type VARCHAR(50) NOT NULL, -- authorization, capture, refund
  amount INTEGER NOT NULL, -- in cents
  stripe_transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- success, failed, pending
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_game_dates_date ON game_dates(date);
CREATE INDEX idx_game_dates_status ON game_dates(status);
CREATE INDEX idx_player_trips_user ON player_trips(user_id);
CREATE INDEX idx_player_trips_dates ON player_trips(start_date, end_date);
CREATE INDEX idx_player_availability_trip ON player_availability(player_trip_id);
CREATE INDEX idx_player_availability_date ON player_availability(game_date_id);
CREATE INDEX idx_games_date ON games(game_date_id);
CREATE INDEX idx_game_players_game ON game_players(game_id);