-- ============================================================
-- GachaPull — Full DB Reset Script
-- Jalankan dengan: psql $DATABASE_URL -f scripts/reset-db.sql
-- ============================================================

-- Drop semua tabel (urutan terbalik karena foreign key)
DROP TABLE IF EXISTS physical_card_requests CASCADE;
DROP TABLE IF EXISTS card_buybacks CASCADE;
DROP TABLE IF EXISTS balance_transactions CASCADE;
DROP TABLE IF EXISTS topup_orders CASCADE;
DROP TABLE IF EXISTS payment_settings CASCADE;
DROP TABLE IF EXISTS user_collection CASCADE;
DROP TABLE IF EXISTS gacha_pulls CASCADE;
DROP TABLE IF EXISTS pack_cards CASCADE;
DROP TABLE IF EXISTS packs CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS user_balance CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enum types lama (semua kemungkinan nama)
DROP TYPE IF EXISTS franchise CASCADE;
DROP TYPE IF EXISTS rarity CASCADE;
DROP TYPE IF EXISTS role CASCADE;
DROP TYPE IF EXISTS topup_method CASCADE;
DROP TYPE IF EXISTS topup_status CASCADE;
DROP TYPE IF EXISTS balance_transaction_type CASCADE;
DROP TYPE IF EXISTS physical_request_status CASCADE;
-- Enum lama (coins/USD era)
DROP TYPE IF EXISTS coin_transaction_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_provider CASCADE;

-- ============================================================
-- Buat Enum Types
-- ============================================================
CREATE TYPE franchise AS ENUM ('pokemon', 'onepiece');
CREATE TYPE rarity AS ENUM ('common', 'rare', 'super_rare', 'ultra_rare', 'legendary');
CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE topup_method AS ENUM ('qris', 'gopay', 'ovo', 'dana', 'bank_transfer');
CREATE TYPE topup_status AS ENUM ('pending', 'completed', 'failed', 'expired');
CREATE TYPE balance_transaction_type AS ENUM ('topup', 'gacha_pull', 'buyback', 'refund', 'adjustment');
CREATE TYPE physical_request_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- ============================================================
-- Buat Tables
-- ============================================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_balance (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_idr INTEGER NOT NULL DEFAULT 0,
  total_topup INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  franchise franchise NOT NULL,
  rarity rarity NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  pull_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE packs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  franchise franchise NOT NULL,
  price_idr INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE pack_cards (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  probability TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE gacha_pulls (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id INTEGER NOT NULL REFERENCES packs(id),
  card_id INTEGER NOT NULL REFERENCES cards(id),
  pulled_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_collection (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  count INTEGER NOT NULL DEFAULT 1,
  first_obtained_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE card_buybacks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  amount_idr INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE physical_card_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  status physical_request_status NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Indonesia',
  tracking_number TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE topup_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_idr INTEGER NOT NULL,
  method topup_method NOT NULL,
  status topup_status NOT NULL DEFAULT 'pending',
  payment_ref TEXT,
  snap_token TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE balance_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_idr INTEGER NOT NULL,
  type balance_transaction_type NOT NULL,
  description TEXT NOT NULL,
  reference_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Seed: 15 Kartu Pokemon
-- ============================================================
INSERT INTO cards (name, franchise, rarity, image_url, description) VALUES
  ('Pikachu', 'pokemon', 'common', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', 'Pokemon listrik yang ikonik'),
  ('Bulbasaur', 'pokemon', 'common', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png', 'Pokemon rumput generasi pertama'),
  ('Charmander', 'pokemon', 'common', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png', 'Pokemon api yang populer'),
  ('Squirtle', 'pokemon', 'common', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png', 'Pokemon air yang lucu'),
  ('Eevee', 'pokemon', 'rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png', 'Pokemon dengan banyak evolusi'),
  ('Gengar', 'pokemon', 'rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png', 'Pokemon hantu yang menakutkan'),
  ('Snorlax', 'pokemon', 'rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png', 'Pokemon yang selalu tidur'),
  ('Dragonite', 'pokemon', 'super_rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png', 'Pokemon naga yang ramah'),
  ('Lapras', 'pokemon', 'super_rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png', 'Pokemon laut yang anggun'),
  ('Alakazam', 'pokemon', 'super_rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png', 'Pokemon psikis paling cerdas'),
  ('Charizard', 'pokemon', 'ultra_rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png', 'Pokemon api yang perkasa'),
  ('Blastoise', 'pokemon', 'ultra_rare', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png', 'Pokemon air dengan meriam punggung'),
  ('Mewtwo', 'pokemon', 'legendary', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png', 'Pokemon legendaris yang diciptakan ilmuwan'),
  ('Mew', 'pokemon', 'legendary', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png', 'Pokemon mitos yang misterius'),
  ('Lugia', 'pokemon', 'legendary', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png', 'Penjaga laut yang agung');

-- ============================================================
-- Seed: 15 Kartu One Piece
-- ============================================================
INSERT INTO cards (name, franchise, rarity, image_url, description) VALUES
  ('Monkey D. Luffy', 'onepiece', 'common', 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/Monkey_D._Luffy.png/220px-Monkey_D._Luffy.png', 'Kapten Bajak Laut Topi Jerami'),
  ('Roronoa Zoro', 'onepiece', 'common', 'https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Roronoa_Zoro.png/220px-Roronoa_Zoro.png', 'Pendekar pedang tiga pedang'),
  ('Nami', 'onepiece', 'common', 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Nami_One_Piece.png/220px-Nami_One_Piece.png', 'Navigator andal Topi Jerami'),
  ('Usopp', 'onepiece', 'common', 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Usopp_One_Piece.png/220px-Usopp_One_Piece.png', 'Penembak jitu berbohong'),
  ('Sanji', 'onepiece', 'rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/7/76/Sanji_One_Piece.png/220px-Sanji_One_Piece.png', 'Koki Topi Jerami'),
  ('Tony Tony Chopper', 'onepiece', 'rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Tony_Tony_Chopper.png/220px-Tony_Tony_Chopper.png', 'Dokter mungil rusa manusia'),
  ('Nico Robin', 'onepiece', 'rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Nico_Robin.png/220px-Nico_Robin.png', 'Arkeolog misterius Topi Jerami'),
  ('Franky', 'onepiece', 'super_rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cb/Franky_One_Piece.png/220px-Franky_One_Piece.png', 'Cyborg tukang kapal SUPER'),
  ('Brook', 'onepiece', 'super_rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fb/Brook_One_Piece.png/220px-Brook_One_Piece.png', 'Musisi kerangka jiwa bebas'),
  ('Jinbe', 'onepiece', 'super_rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Jinbe_One_Piece.png/220px-Jinbe_One_Piece.png', 'Manusia ikan juru mudi'),
  ('Portgas D. Ace', 'onepiece', 'ultra_rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/Portgas_D._Ace.png/220px-Portgas_D._Ace.png', 'Kapten divisi dua Whitebeard'),
  ('Trafalgar Law', 'onepiece', 'ultra_rare', 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Trafalgar_Law.png/220px-Trafalgar_Law.png', 'Dokter maut dengan Ope Ope no Mi'),
  ('Shanks', 'onepiece', 'legendary', 'https://upload.wikimedia.org/wikipedia/en/thumb/b/ba/Red-Haired_Shanks.png/220px-Red-Haired_Shanks.png', 'Yonko berambut merah'),
  ('Whitebeard', 'onepiece', 'legendary', 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Whitebeard_One_Piece.png/220px-Whitebeard_One_Piece.png', 'Pria terkuat di dunia'),
  ('Gol D. Roger', 'onepiece', 'legendary', 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Gol_D._Roger.png/220px-Gol_D._Roger.png', 'Raja Bajak Laut');

-- ============================================================
-- Seed: 4 Pack
-- ============================================================
INSERT INTO packs (name, franchise, price_idr, image_url, description, is_active) VALUES
  ('Pokemon Base Set', 'pokemon', 15000, 'https://upload.wikimedia.org/wikipedia/en/b/b4/Pokemon_Trading_Card_Game_cardback.jpg', 'Pack dasar Pokemon — cocok untuk pemula', TRUE),
  ('Pokemon Legendary', 'pokemon', 75000, 'https://upload.wikimedia.org/wikipedia/en/b/b4/Pokemon_Trading_Card_Game_cardback.jpg', 'Pack premium dengan peluang legendaris lebih tinggi', TRUE),
  ('One Piece Grand Line', 'onepiece', 20000, 'https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_Logo.svg', 'Pack One Piece — mulai petualangan Grand Line', TRUE),
  ('One Piece Emperor', 'onepiece', 100000, 'https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_Logo.svg', 'Pack eksklusif One Piece dengan kartu Yonko', TRUE);

-- ============================================================
-- Seed: Pack Cards (Pokemon Base Set - pack 1)
-- ============================================================
INSERT INTO pack_cards (pack_id, card_id, probability)
SELECT 1, id, CASE rarity
  WHEN 'common' THEN '20'
  WHEN 'rare' THEN '15'
  WHEN 'super_rare' THEN '5'
  WHEN 'ultra_rare' THEN '2'
  WHEN 'legendary' THEN '1'
END
FROM cards WHERE franchise = 'pokemon';

-- Seed: Pack Cards (Pokemon Legendary - pack 2)
INSERT INTO pack_cards (pack_id, card_id, probability)
SELECT 2, id, CASE rarity
  WHEN 'common' THEN '10'
  WHEN 'rare' THEN '20'
  WHEN 'super_rare' THEN '15'
  WHEN 'ultra_rare' THEN '10'
  WHEN 'legendary' THEN '8'
END
FROM cards WHERE franchise = 'pokemon';

-- Seed: Pack Cards (One Piece Grand Line - pack 3)
INSERT INTO pack_cards (pack_id, card_id, probability)
SELECT 3, id, CASE rarity
  WHEN 'common' THEN '20'
  WHEN 'rare' THEN '15'
  WHEN 'super_rare' THEN '5'
  WHEN 'ultra_rare' THEN '2'
  WHEN 'legendary' THEN '1'
END
FROM cards WHERE franchise = 'onepiece';

-- Seed: Pack Cards (One Piece Emperor - pack 4)
INSERT INTO pack_cards (pack_id, card_id, probability)
SELECT 4, id, CASE rarity
  WHEN 'common' THEN '10'
  WHEN 'rare' THEN '20'
  WHEN 'super_rare' THEN '15'
  WHEN 'ultra_rare' THEN '10'
  WHEN 'legendary' THEN '8'
END
FROM cards WHERE franchise = 'onepiece';

-- ============================================================
-- Seed: Payment Settings
-- ============================================================
INSERT INTO payment_settings (key, value) VALUES
  ('midtrans_enabled', 'false'),
  ('midtrans_server_key', ''),
  ('midtrans_client_key', ''),
  ('midtrans_environment', 'sandbox'),
  ('qris_enabled', 'true'),
  ('bank_transfer_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Grant permissions (jika diperlukan untuk user non-superuser)
-- ============================================================
DO $$
DECLARE
  db_user TEXT;
BEGIN
  SELECT current_user INTO db_user;
  IF db_user != 'postgres' THEN
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %I', db_user);
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %I', db_user);
  END IF;
END $$;

SELECT 'Database reset selesai! Jalankan reset-admin untuk membuat user admin.' AS status;
