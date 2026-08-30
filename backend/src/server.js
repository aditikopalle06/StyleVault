const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require('./routes/authRoutes');
const clothingRoutes = require('./routes/clothingRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');

const authenticateToken = require('./middleware/authMiddleware');
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "StyleVault backend is running!"
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/clothing', clothingRoutes);
app.use('/api/preferences', preferencesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`StyleVault server running on http://localhost:${PORT}`);
});