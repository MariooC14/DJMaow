-- This is the database schema for the songs.
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title varchar(50) UNIQUE,
    videoId varchar(50) UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_name ON songs(title);