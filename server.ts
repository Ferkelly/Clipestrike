import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";

const PORT = 3000;

// Setup directories
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const OUTPUTS_DIR = path.join(process.cwd(), "outputs");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Upload video endpoint
  app.post("/api/upload", upload.single("video"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const jobId = uuidv4();
    const videoPath = req.file.path;

    // Start processing in background
    processVideo(jobId, videoPath, io);

    res.json({ jobId, message: "Upload successful, processing started." });
  });

  // Get outputs
  app.use("/outputs", express.static(OUTPUTS_DIR));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Mock Video Processing Pipeline
async function processVideo(jobId: string, videoPath: string, io: Server) {
  const sendProgress = (step: string, progress: number, logs: string) => {
    io.emit(`job-${jobId}`, { step, progress, logs });
  };

  try {
    sendProgress("INIT", 5, "Iniciando processamento do vídeo...");
    await sleep(2000);

    sendProgress("TRANSCRIBE", 20, "Transcrevendo áudio (Whisper)...");
    await sleep(3000);

    sendProgress("ANALYZE", 40, "Analisando momentos de pico e engajamento...");
    await sleep(3000);

    sendProgress("CLIPPING", 60, "Gerando clips otimizados (Smart Crop)...");
    await sleep(3000);

    sendProgress("SUBTITLES", 80, "Aplicando legendas dinâmicas...");
    await sleep(3000);

    // Simulate final output
    const outputFileName = `${jobId}-clip1.mp4`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    
    // In a real environment, we would use ffmpeg here.
    // For the sandbox MVP, we will just copy the original file or create a dummy file if ffmpeg is not available.
    try {
      // Try to use ffmpeg to create a 5-second clip
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .setStartTime(0)
          .setDuration(5)
          .output(outputPath)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });
    } catch (e) {
      console.warn("FFmpeg failed or not available, copying original file as mock output.");
      fs.copyFileSync(videoPath, outputPath);
    }

    sendProgress("DONE", 100, "Processamento concluído!");
    
    io.emit(`job-${jobId}-complete`, {
      clips: [
        {
          id: uuidv4(),
          url: `/outputs/${outputFileName}`,
          title: "Clip 1 - Momento Viral",
          score: 95,
          duration: "15s"
        },
        {
          id: uuidv4(),
          url: `/outputs/${outputFileName}`,
          title: "Clip 2 - Destaque",
          score: 88,
          duration: "12s"
        }
      ]
    });

  } catch (error) {
    console.error("Error processing video:", error);
    sendProgress("ERROR", 0, "Erro no processamento.");
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

startServer();
