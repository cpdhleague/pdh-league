-- PDH League Database Schema Updates
-- Run this in Supabase SQL Editor to add support for new features

-- =================================================
-- 1. Add draws column to track draw results
-- =================================================

-- Add draws to decks table
ALTER TABLE decks ADD COLUMN IF NOT EXISTS draws INTEGER DEFAULT 0;

-- Add elo column to decks (deck-based ELO)
ALTER TABLE decks ADD COLUMN IF NOT EXISTS elo INTEGER DEFAULT 1000;

-- =================================================
-- 2. Add partner commander support to decks
-- =================================================

ALTER TABLE decks ADD COLUMN IF NOT EXISTS second_commander_name TEXT;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS second_commander_id UUID REFERENCES commanders(id);

-- =================================================
-- 3. Add partner-related columns to commanders
-- =================================================

-- Flag for Background cards
ALTER TABLE commanders ADD COLUMN IF NOT EXISTS is_background BOOLEAN DEFAULT false;

-- Flag for commanders with "Choose a Background" ability
ALTER TABLE commanders ADD COLUMN IF NOT EXISTS has_choose_background BOOLEAN DEFAULT false;

-- Flag for commanders with "Partner" ability
ALTER TABLE commanders ADD COLUMN IF NOT EXISTS has_partner BOOLEAN DEFAULT false;

-- For "Partner with X" commanders, store the partner name
ALTER TABLE commanders ADD COLUMN IF NOT EXISTS partner_with TEXT;

-- Flag for "Friends forever" commanders
ALTER TABLE commanders ADD COLUMN IF NOT EXISTS has_friends_forever BOOLEAN DEFAULT false;

-- =================================================
-- 4. Add columns to profiles
-- =================================================

-- Unlimited decks flag for admins/staff
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlimited_decks BOOLEAN DEFAULT false;

-- Deck count for tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deck_count INTEGER DEFAULT 0;

-- Draws for aggregate stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS draws INTEGER DEFAULT 0;

-- Legal name for prize verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS legal_name TEXT;

-- =================================================
-- 5. Add is_draw flag to match_results
-- =================================================

ALTER TABLE match_results ADD COLUMN IF NOT EXISTS is_draw BOOLEAN DEFAULT false;

-- =================================================
-- 6. Update the profile creation trigger to include legal_name
-- =================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, legal_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'legal_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================
-- 7. Update some sample commanders with partner abilities
-- =================================================

-- Update Malcolm with Partner
UPDATE commanders SET has_partner = true WHERE name = 'Malcolm, Keen-Eyed Navigator';

-- Update Kediss with Partner
UPDATE commanders SET has_partner = true WHERE name = 'Kediss, Emberclaw Familiar';

-- Update other Partner commanders
UPDATE commanders SET has_partner = true WHERE name IN (
  'Tormod, the Desecrator',
  'Ghost of Ramirez DePietro',
  'Dargo, the Shipwrecker',
  'Siani, Eye of the Storm',
  'Halana, Kessig Ranger',
  'Keskit, the Flesh Sculptor',
  'Ardenn, Intrepid Archaeologist',
  'Falthis, Shadowcat Familiar',
  'Keleth, Sunmane Familiar',
  'Esior, Wardwing Familiar',
  'Anara, Wolvid Familiar',
  'Ich-Tekik, Salvage Splicer',
  'Toggo, Goblin Weaponsmith',
  'Eligeth, Crossroads Augur',
  'Numa, Joraga Chieftain',
  'Nadier, Agent of the Duskenel',
  'Gilanra, Caller of Wirewood'
);

-- =================================================
-- 8. Add some Background commanders (examples)
-- =================================================

INSERT INTO commanders (name, color_identity, is_legal, is_background) VALUES
('Cloakwood Hermit', 'G', true, true),
('Criminal Past', 'B', true, true),
('Dragon Cultist', 'R', true, true),
('Far Traveler', 'W', true, true),
('Feywild Visitor', 'U', true, true),
('Guild Artisan', 'R', true, true),
('Hardy Outlander', 'G', true, true),
('Noble Heritage', 'W', true, true),
('Raised by Giants', 'G', true, true),
('Scion of Halaster', 'B', true, true),
('Street Urchin', 'R', true, true),
('Sword Coast Sailor', 'U', true, true)
ON CONFLICT (name) DO UPDATE SET is_background = true;

-- =================================================
-- 9. Add some "Choose a Background" commanders (examples)
-- =================================================

INSERT INTO commanders (name, color_identity, is_legal, has_choose_background) VALUES
('Agent of the Iron Throne', 'B', true, true),
('Agent of the Shadow Thieves', 'B', true, true),
('Amber Gristle O''Maul', 'R', true, true),
('Astarion, the Decadent', 'WB', true, true),
('Bjorna, Nightfall Alchemist', 'UR', true, true),
('Cadira, Caller of the Small', 'GW', true, true),
('Commander Liara Portyr', 'WR', true, true),
('Dynaheir, Invoker Adept', 'WUR', true, true),
('Erinis, Gloom Stalker', 'G', true, true),
('Gorion, Wise Mentor', 'WUG', true, true),
('Gut, True Soul Zealot', 'R', true, true),
('Halsin, Emerald Archdruid', 'G', true, true),
('Imoen, Mystic Trickster', 'U', true, true),
('Jaheira, Friend of the Forest', 'G', true, true),
('Karlach, Fury of Avernus', 'R', true, true),
('Lae''zel, Vlaakith''s Champion', 'W', true, true),
('Lulu, Loyal Hollyphant', 'W', true, true),
('Mazzy, Truesword Paladin', 'GW', true, true),
('Minthara, Merciless Soul', 'WB', true, true),
('Miirym, Sentinel Wyrm', 'URG', true, true),
('Rasaad yn Bashir', 'W', true, true),
('Safana, Calimport Cutthroat', 'B', true, true),
('Sarevok, Deathbringer', 'B', true, true),
('Shadowheart, Dark Justiciar', 'WB', true, true),
('Skullport Merchant', 'B', true, true),
('Viconia, Drow Apostate', 'B', true, true),
('Wyll, Blade of Frontiers', 'R', true, true)
ON CONFLICT (name) DO UPDATE SET has_choose_background = true;

-- =================================================
-- Done! Your database now supports:
-- - Draw results in matches
-- - Deck-based ELO ratings
-- - Partner commanders (Partner, Partner with, Choose a Background, Friends forever)
-- - Unlimited free deck registration for admins
-- - Legal name for prize verification
-- =================================================
