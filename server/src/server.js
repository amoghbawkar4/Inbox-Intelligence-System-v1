import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import digestRoutes from "./routes/digestRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import { startDailyDigestJob } from "./jobs/dailyDigestJob.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(helmet());
app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/api/digest", digestRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error({
    message: error.message,
    status: error.status || 500,
    path: req.originalUrl
  });
  res.status(error.status || 500).json({
    message: error.message || "Internal server error"
  });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startDailyDigestJob();
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    process.exit(1);
  }
  throw error;
});

// connect DB separately
connectDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err));