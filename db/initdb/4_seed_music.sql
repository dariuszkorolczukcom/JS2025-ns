-- Seed data for music entries
-- This script adds sample music entries to the database

-- First, ensure we have some genres
INSERT INTO genres (slug, name) VALUES
('rock', 'Rock'),
('pop', 'Pop'),
('jazz', 'Jazz'),
('classical', 'Classical'),
('electronic', 'Electronic'),
('hip-hop', 'Hip-Hop'),
('blues', 'Blues'),
('country', 'Country')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample music entries
INSERT INTO music (title, artist, album, year, genre_slug) VALUES
('Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 1975, 'rock'),
('Stairway to Heaven', 'Led Zeppelin', 'Led Zeppelin IV', 1971, 'rock'),
('Hotel California', 'Eagles', 'Hotel California', 1976, 'rock'),
('Billie Jean', 'Michael Jackson', 'Thriller', 1982, 'pop'),
('Like a Rolling Stone', 'Bob Dylan', 'Highway 61 Revisited', 1965, 'rock'),
('Imagine', 'John Lennon', 'Imagine', 1971, 'pop'),
('Smells Like Teen Spirit', 'Nirvana', 'Nevermind', 1991, 'rock'),
('What a Wonderful World', 'Louis Armstrong', 'What a Wonderful World', 1967, 'jazz'),
('Moonlight Sonata', 'Ludwig van Beethoven', 'Piano Sonata No. 14', 1801, 'classical'),
('Take Five', 'Dave Brubeck', 'Time Out', 1959, 'jazz'),
('Blue Moon', 'Frank Sinatra', 'In the Wee Small Hours', 1955, 'jazz'),
('Thunderstruck', 'AC/DC', 'The Razors Edge', 1990, 'rock'),
('Sweet Child O Mine', 'Guns N Roses', 'Appetite for Destruction', 1987, 'rock'),
('Purple Rain', 'Prince', 'Purple Rain', 1984, 'pop'),
('Lose Yourself', 'Eminem', '8 Mile Soundtrack', 2002, 'hip-hop'),
('Shape of You', 'Ed Sheeran', '÷ (Divide)', 2017, 'pop'),
('Blinding Lights', 'The Weeknd', 'After Hours', 2019, 'pop'),
('Watermelon Sugar', 'Harry Styles', 'Fine Line', 2019, 'pop'),
('Good 4 U', 'Olivia Rodrigo', 'SOUR', 2021, 'pop'),
('Levitating', 'Dua Lipa', 'Future Nostalgia', 2020, 'pop')
ON CONFLICT DO NOTHING;

