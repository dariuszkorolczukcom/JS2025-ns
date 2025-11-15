const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/music.json');

// Helper function to read data from JSON file
const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Helper function to write data to JSON file
const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

// Get all music entries
const getAllMusic = (req, res) => {
  try {
    const music = readData();
    res.json(music);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch music', message: error.message });
  }
};

// Get music by ID
const getMusicById = (req, res) => {
  try {
    const music = readData();
    const musicId = parseInt(req.params.id);
    const entry = music.find(m => m.id === musicId);
    
    if (!entry) {
      return res.status(404).json({ error: 'Music entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch music entry', message: error.message });
  }
};

// Create new music entry
const createMusic = (req, res) => {
  try {
    const { title, artist, album, year, genre } = req.body;
    
    // Validation
    if (!title || !artist) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'artist']
      });
    }
    
    const music = readData();
    
    // Generate new ID
    const newId = music.length > 0 ? Math.max(...music.map(m => m.id)) + 1 : 1;
    
    // Create new music entry
    const newMusic = {
      id: newId,
      title,
      artist,
      album: album || title,
      year: year || null,
      genre: genre || 'Unknown',
      createdAt: new Date().toISOString()
    };
    
    music.push(newMusic);
    writeData(music);
    
    res.status(201).json(newMusic);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create music entry', message: error.message });
  }
};

module.exports = {
  getAllMusic,
  getMusicById,
  createMusic
};

