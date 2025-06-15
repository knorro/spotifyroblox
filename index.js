const express = require("express");
const fetch = require("node-fetch");
const FormData = require("form-data");
const app = express();

app.use(express.json());

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const CREATOR_ID = process.env.CREATOR_ID;

if (!ROBLOX_API_KEY) {
  console.warn("⚠️ ROBLOX_API_KEY ontbreekt!");
}
if (!CREATOR_ID) {
  console.warn("⚠️ CREATOR_ID ontbreekt!");
}

// 🔽 Download afbeelding als buffer
async function downloadImage(url) {
  console.log("📥 Downloading image from:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  const buffer = await res.buffer();
  console.log("✅ Afbeelding gedownload. Grootte:", buffer.length);
  return buffer;
}

// 🔼 Upload buffer naar Roblox
async function uploadToRoblox(imageBuffer) {
  console.log("📤 Upload naar Roblox wordt gestart...");

  const formData = new FormData();
  formData.append("fileContent", imageBuffer, {
    filename: "album.jpg",
    contentType: "image/jpeg",
  });

  const headers = {
    "x-api-key": ROBLOX_API_KEY,
    ...formData.getHeaders(), // ← belangrijk voor multipart/form-data
  };

  console.log("🧪 Headers:", headers);
  console.log("🧪 Form bevat:", formData.getLengthSync(), "bytes");

  const res = await fetch("https://apis.roblox.com/assets/v1/assets", {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("❌ Upload failed:", res.status, text);
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  console.log("✅ Upload gelukt:", text);
  const json = JSON.parse(text);
  return json.assetId;
}

// 🚀 Endpoint
app.post("/uploadAlbumCover", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "No imageUrl provided" });

    const imageBuffer = await downloadImage(imageUrl);
    const assetId = await uploadToRoblox(imageBuffer);
    res.json({ assetId });
  } catch (error) {
    console.error("🔥 Fout bij upload:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server draait op poort ${PORT}`);
});
