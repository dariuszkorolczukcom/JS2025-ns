import express from 'express';
import passport from './config/passport';
import router from './routes'
import { pool } from './config/database';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/', router);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path 
    });
});

pool.connect().then(() => {
    console.log('Connected to the database');

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`API endpoints available at http://localhost:${PORT}/api`);
    }); 

}).catch((err) => {
    console.error('Error connecting to the database', err);
    process.exit(1);
});

export default app;
