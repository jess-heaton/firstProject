import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_req, res) => {
    res.send('Welcome to the Flatmate Finder!');
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
