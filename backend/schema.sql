-- Schema para el concurso de karaoke

CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'registration', -- registration, in_progress, finished
    current_round INT DEFAULT 0,
    total_rounds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    participant_code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    eliminated_round INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rounds (
    id SERIAL PRIMARY KEY,
    contest_id INT REFERENCES contests(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    round_type VARCHAR(50) DEFAULT 'individual', -- individual, pairs
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    round_id INT REFERENCES rounds(id) ON DELETE CASCADE,
    match_number INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, voting, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_participants (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    participant_id INT REFERENCES participants(id) ON DELETE CASCADE,
    song_name VARCHAR(255),
    total_score DECIMAL(10, 2) DEFAULT 0,
    adjusted_score DECIMAL(10, 2) DEFAULT 0,
    is_winner BOOLEAN DEFAULT false,
    performance_order INT
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    voter_id INT REFERENCES participants(id) ON DELETE CASCADE,
    voted_for_id INT REFERENCES match_participants(id) ON DELETE CASCADE,
    score DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, voter_id, voted_for_id)
);

CREATE TABLE IF NOT EXISTS admin_adjustments (
    id SERIAL PRIMARY KEY,
    match_participant_id INT REFERENCES match_participants(id) ON DELETE CASCADE,
    adjustment_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_participants_contest ON participants(contest_id);
CREATE INDEX idx_participants_code ON participants(participant_code);
CREATE INDEX idx_rounds_contest ON rounds(contest_id);
CREATE INDEX idx_matches_round ON matches(round_id);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_votes_match ON votes(match_id);
