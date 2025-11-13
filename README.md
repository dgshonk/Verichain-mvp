# Verichain-mvp
AI-powered fact checker with immutable vault. 


index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>VeriChain</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 20px; background: #f9f9fb; }
    input, button { padding: 12px; margin: 8px 0; width: 100%; font-size: 16px; border-radius: 8px; border: 1px solid #ddd; }
    button { background: #007bff; color: white; font-weight: bold; }
    #result { margin-top: 16px; padding: 16px; background: #e9f7ef; border-radius: 8px; }
    .vault { margin: 16px 0; padding: 12px; background: white; border: 1px solid #eee; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>VeriChain</h1>
  <p>AI-powered fact-checking. Every claim saved forever.</p>

  <input id="claim" placeholder="Enter a claim (e.g., Bitcoin launched in 2009)" />
  <input id="source" placeholder="Source URL (optional)" />
  <button onclick="verify()">Verify Fact</button>

  <div id="result"></div>
  <h3>Your Vault</h3>
  <div id="vault"></div>

  <script>
    async function verify() {
      const claim = document.getElementById('claim').value;
      const source = document.getElementById('source').value || "No source";

      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, source })
      });
      const data = await res.json();

      document.getElementById('result').innerHTML = `
        <strong>Verdict:</strong> ${data.verdict}<br>
        <small>Saved to vault #${data.id}</small>
      `;

      loadVault();
    }

    async function loadVault() {
      const res = await fetch('/api/vault');
      const items = await res.json();
      const vault = document.getElementById('vault');
      vault.innerHTML = items.map(i => `
        <div class="vault">
          <strong>${i.claim}</strong><br>
          <small>Source: ${i.source} | ${new Date(i.timestamp).toLocaleString()}</small><br>
          <em>${i.verdict}</em>
        </div>
      `).join('');
    }

    // Load on start
    loadVault();
  </script>
</body>
</html>



server.js 
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serve index.html

// In-memory vault (restarts on refresh — perfect for MVP)
let vault = [];
let idCounter = 1;

// AI Fact-Check via Hugging Face (FREE)
async function checkFact(claim) {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // ← Get free key below
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Is this true? "${claim}" Answer in 1 sentence with "True", "False", or "Uncertain".`
        })
      }
    );
    const data = await response.json();
    return data[0]?.generated_text?.trim() || "Uncertain (AI timeout)";
  } catch (e) {
    return "Error: AI unavailable";
  }
}

// API: Verify fact
app.post('/api/verify', async (req, res) => {
  const { claim, source } = req.body;
  const verdict = await checkFact(claim);

  const entry = {
    id: idCounter++,
    claim,
    source,
    verdict,
    timestamp: new Date().toISOString()
  };
  vault.push(entry);

  res.json(entry);
});

// API: Get vault
app.get('/api/vault', (req, res) => {
  res.json(vault);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`VeriChain MVP running on port ${port}`);
  console.log(`Open: http://localhost:${port}`);
});

package.json
{
  "name": "verichain-mvp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-fetch": "^3.3.2"
  }
}
