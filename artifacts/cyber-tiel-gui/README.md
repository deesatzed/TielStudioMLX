# Cyber-Tiel Coder GUI

Local Apple Silicon GUI for **[peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP](https://huggingface.co/peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP)**.

Specialized agentic coding + cybersecurity VLM (35B MoE, ~3.4B active, oQ6e ~30.4 GB, vision + MTP).  
**Must use `mlx-vlm` (not `mlx-lm`)**.

## Quick Start (Scaffold)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Download model first:
# hf download peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP --local-dir ./models/CyberTiel-MLX-MTP

python -m app.main --model ./models/CyberTiel-MLX-MTP --port 8080
```

Open http://127.0.0.1:8080

## Feature List (Prioritized)

### MVP (Phase 1)
- [ ] Model load/unload with status + memory pressure indicator (mx.metal + system)
- [ ] Streaming chat (text) with Sharp template applied automatically
- [ ] Image / screenshot upload + vision analysis ("What is in this screenshot?", code review of UI)
- [ ] Syntax-highlighted code blocks in responses
- [ ] Sampling controls (temp 0.6 / top_p 0.95 / top_k 20 for coding; top_k 40 / min_p 0.05 for cyber)
- [ ] High max_tokens ceiling (32k+) with progress
- [ ] Session history (local JSONL)
- [ ] Basic system prompt presets: Agentic Coding, Offensive Security / CTF, Screenshot Review

### Phase 2 – Coding Focus
- [ ] Project / file context injection (drag-drop folder or select files; truncate smartly)
- [ ] Diff viewer for generated patches
- [ ] "Apply to file" stub (write with confirmation)
- [ ] Tool-calling UI stubs (function calling visualization)
- [ ] Vision cache status (mlx-vlm VisionFeatureCache)

### Phase 3 – Safety & Ops
- [ ] Sandbox warnings + process isolation notes (abliterated model)
- [ ] Memory limit / cache clear button
- [ ] MTP toggle (optional; minimal gain on Apple Silicon)
- [ ] Export chat + code
- [ ] Dark mode, keyboard shortcuts

### Non-goals (for this scaffold)
- Full agent loop / SWE-bench harness (use Pi.dev or external)
- Multi-user remote serving without auth
- LM Studio compatibility (MTP fails there)

## Specs

### Hardware
- Apple Silicon only
- ≥36 GB unified memory recommended (32 GB tight)
- Model ~30.4 GB on disk

### Runtime
- `mlx-vlm` (latest)
- Load via `mlx_vlm.load` / `stream_generate`
- Optional: proxy to `mlx_vlm.server` or oMLX for OpenAI-compatible clients

### Architecture
```
Browser (chat + image drop)
    │
    ▼
FastAPI / Flask + SocketIO (or SSE)
    │
    ▼
mlx_vlm.stream_generate
    (model, processor, formatted_prompt, images, sampling, vision_cache)
```

### Key Constraints
- Never use `mlx_lm.load` on this checkpoint
- Thumbnail large images (≤640–1024) before vision encode to save memory
- Single-turn or carefully managed multi-turn (KV can grow)
- Sandbox the process; abliterated → can generate harmful content

### Recommended Defaults
- temperature: 0.6
- top_p: 0.95
- top_k: 20
- max_tokens: 8192–32768 for real work
- vision_cache: enabled

## Scaffold Layout

```
cyber-tiel-gui/
├── app/
│   ├── main.py          # entry + FastAPI/Flask
│   ├── model.py         # mlx-vlm load / generate wrapper
│   ├── config.py
│   └── routes.py
├── static/
│   ├── app.js
│   └── style.css
├── templates/
│   └── index.html
├── docs/
│   └── SPECS.md
├── requirements.txt
└── README.md
```

See `docs/SPECS.md` for full design.
