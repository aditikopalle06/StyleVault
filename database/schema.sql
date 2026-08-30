-- ============================================================
-- StyleVault - PostgreSQL Schema
-- Database: stylevault
-- Target: PostgreSQL 18
-- ============================================================
-- Naming notes (no structural changes to the spec):
--   * "USER" is renamed to "users"          (USER is a reserved keyword)
--   * "CALENDAR" is renamed to "calendar_event", and its date/time
--     columns to event_date/event_time      (date/time are built-in type names)
-- ============================================================

-- Run this once, connected to the "stylevault" database.
-- (Database creation itself is intentionally left out of this
--  script — see section G in the chat reply for how to create it.)

BEGIN;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    user_id        BIGSERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    password_hash  TEXT         NOT NULL,   -- store bcrypt/argon2 hash, never plaintext
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email)
);

COMMENT ON TABLE users IS 'Application user accounts. "USER" renamed to "users" — reserved keyword in PostgreSQL.';

-- ============================================================
-- 2. USER_PREFERENCES  (strict 1:1 with users)
-- ============================================================
CREATE TABLE user_preferences (
    preference_id           BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL,

    -- Multi-value fields stored as native PostgreSQL arrays.
    -- Practical choice for a student project: avoids 3+ extra
    -- lookup/junction tables for what is essentially a short list
    -- of tags picked from a fixed set of options. Query with
    -- ANY()/&& operators, e.g.:
    --   SELECT * FROM user_preferences WHERE 'Casual' = ANY(preferred_styles);
    preferred_styles        TEXT[],
    preferred_colours       TEXT[],
    preferred_occasions     TEXT[],
    preferred_seasons       TEXT[],

    preferred_fit           VARCHAR(50),
    additional_preferences  TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_prefs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- UNIQUE on user_id is what actually enforces the 1:1 relationship
    CONSTRAINT uq_prefs_user UNIQUE (user_id)
);

COMMENT ON TABLE user_preferences IS 'One preference profile per user, used by the AI outfit assistant.';

-- ============================================================
-- 3. CLOTHING
-- ============================================================
CREATE TABLE clothing (
    item_id     BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    name        VARCHAR(150) NOT NULL,
    category    VARCHAR(50)  NOT NULL,   -- Top, Bottom, Dress, Outerwear, Shoes, Accessories, ...
    colour      VARCHAR(50)  NOT NULL,
    season      VARCHAR(50),
    price       NUMERIC(10,2),
    image       TEXT,                    -- path/URL only, never binary image data
    size        VARCHAR(20),
    occasion    VARCHAR(50),
    extra_info  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_clothing_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_clothing_price CHECK (price IS NULL OR price >= 0)
);

COMMENT ON TABLE clothing IS 'Individual wardrobe items. Independently createable/editable/deletable per requirements.';

-- ============================================================
-- 4. OUTFIT
-- ============================================================
CREATE TABLE outfit (
    outfit_id    BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    outfit_name  VARCHAR(150) NOT NULL,
    occasion     VARCHAR(50),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    favourite    BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT fk_outfit_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE outfit IS 'A named combination of clothing items created by a user.';

-- ============================================================
-- 5. OUTFIT_ITEM  (junction: OUTFIT N:M CLOTHING)
-- ============================================================
CREATE TABLE outfit_item (
    outfit_item_id  BIGSERIAL PRIMARY KEY,
    outfit_id       BIGINT NOT NULL,
    item_id         BIGINT NOT NULL,

    CONSTRAINT fk_outfititem_outfit
        FOREIGN KEY (outfit_id) REFERENCES outfit(outfit_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_outfititem_item
        FOREIGN KEY (item_id) REFERENCES clothing(item_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- Prevents the same clothing item being added twice to the same outfit
    CONSTRAINT uq_outfit_item UNIQUE (outfit_id, item_id)
);

COMMENT ON TABLE outfit_item IS 'Resolves the OUTFIT <-> CLOTHING many-to-many relationship.';

-- ============================================================
-- 6. CALENDAR_EVENT  (spec entity: CALENDAR)
-- ============================================================
CREATE TABLE calendar_event (
    event_id    BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    outfit_id   BIGINT NOT NULL,
    event_name  VARCHAR(150) NOT NULL,
    event_date  DATE NOT NULL,
    event_time  TIME,

    CONSTRAINT fk_calendar_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_calendar_outfit
        FOREIGN KEY (outfit_id) REFERENCES outfit(outfit_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE calendar_event IS 'Schedules a specific outfit for a specific date/time. Renamed from CALENDAR.';

-- ============================================================
-- 7. WEAR_HISTORY  (no user_id — reached via CLOTHING -> USERS)
-- ============================================================
CREATE TABLE wear_history (
    wear_id    BIGSERIAL PRIMARY KEY,
    item_id    BIGINT NOT NULL,
    wear_date  DATE NOT NULL,
    rating     SMALLINT,
    notes      TEXT,

    CONSTRAINT fk_wearhistory_item
        FOREIGN KEY (item_id) REFERENCES clothing(item_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_wearhistory_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

COMMENT ON TABLE wear_history IS 'Per-wear log for a clothing item. User is reached via item_id -> clothing.user_id.';

-- ============================================================
-- INDEXES
-- (Primary keys and UNIQUE constraints already create indexes
--  automatically; these cover the remaining FK/common lookup columns.)
-- ============================================================
CREATE INDEX idx_clothing_user_id       ON clothing(user_id);
CREATE INDEX idx_clothing_category      ON clothing(category);

CREATE INDEX idx_outfit_user_id         ON outfit(user_id);

CREATE INDEX idx_outfititem_outfit_id   ON outfit_item(outfit_id);
CREATE INDEX idx_outfititem_item_id     ON outfit_item(item_id);

CREATE INDEX idx_calendar_user_id       ON calendar_event(user_id);
CREATE INDEX idx_calendar_outfit_id     ON calendar_event(outfit_id);
CREATE INDEX idx_calendar_event_date    ON calendar_event(event_date);

CREATE INDEX idx_wearhistory_item_id    ON wear_history(item_id);
CREATE INDEX idx_wearhistory_wear_date  ON wear_history(wear_date);

COMMIT;

-- ============================================================
-- E. SAMPLE DATA
-- ============================================================

INSERT INTO users (username, name, email, password_hash) VALUES
('anita_r', 'Anita Rao', 'anita.rao@example.com', '$2b$12$examplehash1'),
('kabir88', 'Kabir Mehta', 'kabir.mehta@example.com', '$2b$12$examplehash2');

INSERT INTO user_preferences (user_id, preferred_styles, preferred_colours, preferred_occasions, preferred_seasons, preferred_fit, additional_preferences) VALUES
(1, ARRAY['Casual','Minimal'], ARRAY['Black','White','Beige'], ARRAY['College','Casual'], ARRAY['Summer','Monsoon'], 'Regular', 'Prefers breathable fabrics.'),
(2, ARRAY['Streetwear','Formal'], ARRAY['Navy','Grey'], ARRAY['Party','Formal'], ARRAY['Winter'], 'Oversized', NULL);

INSERT INTO clothing (user_id, name, category, colour, season, price, image, size, occasion, extra_info) VALUES
(1, 'White Cotton Shirt', 'Top', 'White', 'Summer', 799.00, '/images/anita/shirt_white.jpg', 'M', 'College', NULL),
(1, 'Black Slim Jeans', 'Bottom', 'Black', 'All Season', 1499.00, '/images/anita/jeans_black.jpg', 'M', 'Casual', 'Stretch fit'),
(2, 'Navy Blazer', 'Outerwear', 'Navy', 'Winter', 3499.00, '/images/kabir/blazer_navy.jpg', 'L', 'Formal', NULL);

INSERT INTO outfit (user_id, outfit_name, occasion, favourite) VALUES
(1, 'Campus Casual', 'College', true),
(2, 'Interview Ready', 'Formal', false);

INSERT INTO outfit_item (outfit_id, item_id) VALUES
(1, 1),
(1, 2),
(2, 3);

INSERT INTO calendar_event (user_id, outfit_id, event_name, event_date, event_time) VALUES
(1, 1, 'Monday Classes', '2026-09-01', '08:30:00'),
(2, 2, 'Placement Interview', '2026-09-03', '10:00:00');

INSERT INTO wear_history (item_id, wear_date, rating, notes) VALUES
(1, '2026-08-20', 4, 'Comfortable for a long lecture day.'),
(2, '2026-08-20', 5, NULL),
(3, '2026-08-15', 3, 'A bit warm indoors.');

-- ============================================================
-- F. VERIFICATION QUERIES
-- ============================================================

-- All users
SELECT user_id, username, name, email, created_at FROM users;

-- All clothing items (with owner)
SELECT c.item_id, u.username, c.name, c.category, c.colour, c.price
FROM clothing c
JOIN users u ON u.user_id = c.user_id
ORDER BY c.item_id;

-- Outfits with their clothing items
SELECT o.outfit_id, o.outfit_name, o.occasion, c.name AS item_name, c.category
FROM outfit o
JOIN outfit_item oi ON oi.outfit_id = o.outfit_id
JOIN clothing c     ON c.item_id = oi.item_id
ORDER BY o.outfit_id;

-- Calendar events with the scheduled outfit
SELECT ce.event_id, u.username, ce.event_name, ce.event_date, ce.event_time, o.outfit_name
FROM calendar_event ce
JOIN users u  ON u.user_id = ce.user_id
JOIN outfit o ON o.outfit_id = ce.outfit_id
ORDER BY ce.event_date;

-- Wear history with item and owning user (joined through clothing)
SELECT wh.wear_id, u.username, c.name AS item_name, wh.wear_date, wh.rating, wh.notes
FROM wear_history wh
JOIN clothing c ON c.item_id = wh.item_id
JOIN users u    ON u.user_id = c.user_id
ORDER BY wh.wear_date;

-- User preferences
SELECT up.preference_id, u.username, up.preferred_styles, up.preferred_colours,
       up.preferred_occasions, up.preferred_seasons, up.preferred_fit, up.additional_preferences
FROM user_preferences up
JOIN users u ON u.user_id = up.user_id;

-- Example "calculated" values (NOT stored, computed on demand):
-- clothing count per user
SELECT u.username, COUNT(c.item_id) AS clothing_count
FROM users u LEFT JOIN clothing c ON c.user_id = u.user_id
GROUP BY u.username;

-- wear count per clothing item
SELECT c.name, COUNT(wh.wear_id) AS wear_count
FROM clothing c LEFT JOIN wear_history wh ON wh.item_id = c.item_id
GROUP BY c.name;
