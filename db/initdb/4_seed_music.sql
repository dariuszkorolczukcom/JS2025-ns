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
INSERT INTO music (title, artist, album, year, genre_slug, youtube_url) VALUES
('Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 1975, 'rock', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'),
('Stairway to Heaven', 'Led Zeppelin', 'Led Zeppelin IV', 1971, 'rock', 'https://www.youtube.com/watch?v=QkF3oxziUI4'),
('Hotel California', 'Eagles', 'Hotel California', 1976, 'rock', 'https://www.youtube.com/watch?v=dLl4PZtxia8'),
('Billie Jean', 'Michael Jackson', 'Thriller', 1982, 'pop', 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y'),
('Like a Rolling Stone', 'Bob Dylan', 'Highway 61 Revisited', 1965, 'rock', 'https://www.youtube.com/watch?v=IwOfCgkyEj0'),
('Imagine', 'John Lennon', 'Imagine', 1971, 'pop', 'https://www.youtube.com/watch?v=VOgFZfRVaww'),
('Smells Like Teen Spirit', 'Nirvana', 'Nevermind', 1991, 'rock', 'https://www.youtube.com/watch?v=hTWKbfoikeg'),
('What a Wonderful World', 'Louis Armstrong', 'What a Wonderful World', 1967, 'jazz', 'https://www.youtube.com/watch?v=CaCSuzR4DwM'),
('Moonlight Sonata', 'Ludwig van Beethoven', 'Piano Sonata No. 14', 1801, 'classical', 'https://www.youtube.com/watch?v=4Tr0otuiQuU'),
('Take Five', 'Dave Brubeck', 'Time Out', 1959, 'jazz', 'https://www.youtube.com/watch?v=vmDDOFXSgAs'),
('Blue Moon', 'Frank Sinatra', 'In the Wee Small Hours', 1955, 'jazz', 'https://www.youtube.com/watch?v=Jgi1txjrKZk'),
('Thunderstruck', 'AC/DC', 'The Razors Edge', 1990, 'rock', 'https://www.youtube.com/watch?v=v2AC41dglnM'),
('Sweet Child O Mine', 'Guns N Roses', 'Appetite for Destruction', 1987, 'rock', 'https://www.youtube.com/watch?v=1w7OgIMMRc4'),
('Purple Rain', 'Prince', 'Purple Rain', 1984, 'pop', 'https://www.youtube.com/watch?v=TvnYmWpD_T8'),
('Lose Yourself', 'Eminem', '8 Mile Soundtrack', 2002, 'hip-hop', 'https://www.youtube.com/watch?v=xFYQQPAOz7Y'),
('Shape of You', 'Ed Sheeran', '÷ (Divide)', 2017, 'pop', 'https://www.youtube.com/watch?v=JGwWNGJdvx8'),
('Blinding Lights', 'The Weeknd', 'After Hours', 2019, 'pop', 'https://www.youtube.com/watch?v=4NRXx6U8ABQ'),
('Watermelon Sugar', 'Harry Styles', 'Fine Line', 2019, 'pop', 'https://www.youtube.com/watch?v=E07s5ZYygMg'),
('Good 4 U', 'Olivia Rodrigo', 'SOUR', 2021, 'pop', 'https://www.youtube.com/watch?v=gNi_6U5Pm_o'),
('Levitating', 'Dua Lipa', 'Future Nostalgia', 2020, 'pop', 'https://www.youtube.com/watch?v=TUVcZfQe-Kw')
ON CONFLICT DO NOTHING;

