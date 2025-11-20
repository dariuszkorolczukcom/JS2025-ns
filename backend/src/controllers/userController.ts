import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const dataPath = path.join(__dirname, '../data/users.json');

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
const writeData = (data: any) => {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data to file:', error);
    }
};

// Get all users
const getAllUsers = (req: Request, res: Response) => {
    try {
        const users = readData();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
};

// Get user by ID
const getUserById = (req: Request, res: Response) => {
    try {
        const users = readData();
        const userId = parseInt(req.params.id);
        const user = users.find((u: any) => u.id === userId);
        
        if (!user) {
        return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch user', message: error.message });
    }
};

// Create new user
const createUser = (req: Request, res: Response) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Validation
        if (!username || !email || !password) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['username', 'email', 'password']
        });
        }
        
        const users = readData();
        
        // Check if user already exists
        const existingUser = users.find((u: any) => u.email === email || u.username === username);
        if (existingUser) {
        return res.status(409).json({ error: 'User with this email or username already exists' });
        }
        
        // Generate new ID
        const newId = users.length > 0 ? Math.max(...users.map((u: any) => u.id)) + 1 : 1;
        
        // Create new user
        const newUser = {
        id: newId,
        username,
        email,
        password, // In production, this should be hashed
        role: role || 'user',
        createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        writeData(users);
        
        res.status(201).json(newUser);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
};

export default {
    getAllUsers,
    getUserById,
    createUser
};
