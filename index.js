const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const CREATOR_ID = process.env.CREATOR_ID;

// Helper: download afbeelding als buffer
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  return await res.buffer();
}

// Helper: upload buffer naar Roblox Open Cloud API
async function uploadToRoblox(imageBuffer) {
  const formData = new (require("form-data"))();
  formData.append("file", imageBuffer, {
    filename: "album.jpg",
    contentType: "image/jpeg",
  });
  
 const res = await fetch("https://apis.roblox.com/assets/v1/assets/upload", {
    method: "POST",
    headers: {
      "x-api-key": ROBLOX_API_KEY,
      ...formData.getHeaders(), // ← belangrijk!
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.assetId; // Dit is het Roblox asset ID
}

app.post("/uploadAlbumCover", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "No imageUrl provided" });

    // 1. Download de album cover
    const imageBuffer = await downloadImage(imageUrl);

    // 2. Upload naar Roblox Open Cloud
    const assetId = await uploadToRoblox(imageBuffer);

    // 3. Return Roblox assetId
    res.json({ assetId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
