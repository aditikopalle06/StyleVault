const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require("./routes/profileRoutes");
const clothingRoutes = require('./routes/clothingRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const outfitRoutes = require('./routes/outfitRoutes');
const calendarRoutes = require("./routes/calendarRoutes");
const wearHistoryRoutes = require("./routes/wearHistoryRoutes");
const aiAssistantRoutes = require("./routes/aiAssistantRoutes");

const authenticateToken = require('./middleware/authMiddleware');
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "StyleVault backend is running!"
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/clothing', clothingRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/outfits', outfitRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/wear-history", wearHistoryRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`StyleVault server running on http://localhost:${PORT}`);
});