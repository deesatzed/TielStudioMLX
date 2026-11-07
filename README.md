# Cyber-Tiel Studio

Coding cockpit for [Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP](https://huggingface.co/peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP), a 35B mixture-of-experts vision coder (about 3.4B active, oQ6e, ~30 GB). The checkpoint is an Apple Silicon MLX build. Load it with **mlx-vlm**, not mlx-lm. LM Studio mishandles this MTP build.

The studio itself is a web app. It does not ship the weights. Until you connect a Mac runtime, **Preview** answers through a capped stand-in so you can use the interface.

## Features

- Threads that stay in this browser (title taken from the first prompt).
- Streaming replies, with fenced code blocks and a copy button.
- Screenshot attach (PNG, JPEG, WebP, GIF). Images are scaled down before they are sent. Drop a file on the composer or use the image button.
- Presets:
  - **Coding** — temperature 0.6, top-p 0.95, top-k 20, 1400 tokens.
  - **Review** — temperature 0.4, top-p 0.9, top-k 40, 1400 tokens.
  - **Vision** — temperature 0.3, top-p 0.9, top-k 20, 900 tokens.
- Sampling sliders for temperature, top-p, top-k, and max tokens (capped at 2048).
- Stop a turn in progress. Enter sends; Shift+Enter inserts a newline.
- Turn-budget meter (soft 32k). The checkpoint context is 262k; preview output stays inside 2k tokens.
- Checkpoint card: weights, quant, loader, vision, and a memory note (comfortable on 36 GB).
- Two runtimes:
  - **Preview** — stand-in inference. The server reads `XAI_API_KEY` from the environment. The key never reaches the browser.
  - **Mac runtime** — your machine. The browser calls `POST {base}/v1/chat/completions` with streaming. Optional API key is stored only in this browser.

On a narrow screen, threads and the inspector open from the header.

## Setup

Requires Node 22.

```bash
npm install
npm run dev
```

The dev server listens on port 8080.

```bash
npm run typecheck
npm run build
```

`npm run build` also runs the database migrator. With no `DATABASE_URL` it skips. This app does not need a database; threads live in the browser.

### Preview runtime

Set `XAI_API_KEY` in the server environment before `npm run dev`. Do not put the key in client code or a `VITE_` variable. If the key is missing, Preview turns fail and the inspector says so. Switch to Mac runtime instead.

### Mac runtime (the real checkpoint)

On the Apple Silicon machine that will hold the weights:

```bash
pip install mlx-vlm
mlx_vlm.server --model peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP
```

`mlx_vlm.server` serves an OpenAI-compatible API, including `POST /v1/chat/completions`, and is the right loader for this vision + MTP checkpoint. Do not use `mlx_lm.server` or `mlx_lm.load`.

Then in the studio:

1. Open the inspector (sliders icon on a phone).
2. Choose **Mac runtime**.
3. Set **Base URL** to the server origin with no `/v1` suffix. The default in the app is `http://127.0.0.1:8000`. `mlx_vlm.server` usually listens on port 8080, which is also what this studio uses in dev, so run the model server on another port or open the studio from a different origin and point Base URL at `http://127.0.0.1:8080`.
4. Leave **Model id** as `peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP` unless your server expects a shorter name.
5. Leave **API key** empty unless the server requires one.

The browser must be allowed to call that origin. If the server refuses the page, the studio reports it instead of falling back to Preview.

oMLX is the same idea: any server that accepts `POST /v1/chat/completions` with `stream: true` and OpenAI-style `image_url` parts. Top-k is sent first; if the server returns 400, the studio retries once without it.

## What a turn sends

Preview turns go to this app’s `/api/chat` route. Local turns go straight from the browser to your runtime. Both get the last few messages, one image on the latest user turn, and the active sampling preset. Older screenshots are noted in text only, so a long thread does not re-upload every image.

The weights are abliterated. Keep the Mac process sandboxed.
