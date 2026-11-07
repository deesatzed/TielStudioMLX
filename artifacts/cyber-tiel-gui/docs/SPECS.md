# Cyber-Tiel Coder GUI – Technical Specs

## 1. Purpose
Local, private GUI optimized for the Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP model on Apple Silicon. Focus: agentic coding, screenshot/code vision analysis, and uncensored cybersecurity tasks.

## 2. Model Integration Contract
- **Loader**: `from mlx_vlm import load, stream_generate`
- **Never**: `mlx_lm.load` or LM Studio MLX engine
- **Model path**: local directory or HF id `peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP`
- **Vision**: pass list of image paths / PIL / bytes; use `VisionFeatureCache` for multi-turn same image
- **Template**: Sharp template is embedded; `apply_chat_template` handles it
- **MTP**: optional flag if runtime supports; expect negligible speedup on M-series

## 3. UI Surfaces

### Chat Pane
- Streaming tokens
- Markdown + code fence rendering (Prism/Highlight.js)
- Image preview thumbnails in history
- Stop / regenerate

### Input Bar
- Textarea (multi-line)
- Image drop / paste / file picker (multi-image support where model allows)
- Sampling drawer (temp, top_p, top_k, max_tokens)
- Preset buttons: Coding / Cyber / Vision Review

### Sidebar
- Model status + Metal memory used
- Session list
- System prompt editor
- Clear cache / unload model

## 4. Backend API (suggested)

| Endpoint | Method | Body | Notes |
|----------|--------|------|-------|
| /api/load | POST | `{model_path}` | async load |
| /api/generate | POST | messages + images + sampling | SSE stream |
| /api/status | GET | - | memory, loaded, tok/s last |
| /api/unload | POST | - | free memory |
| /api/sessions | GET/POST | - | local JSONL store |

## 5. Memory & Safety
- Call `mx.metal.clear_cache()` + `gc.collect()` after heavy vision or long generations
- Cap Metal cache (e.g. 4–8 GiB) if needed
- Display prominent warning: "Abliterated model – sandbox recommended"
- No automatic code execution in MVP

## 6. Tech Stack Recommendation
- **Backend**: FastAPI + SSE (or Flask-SocketIO matching DeskGuard style)
- **Frontend**: plain HTML/JS + Highlight.js (or Gradio for fastest prototype)
- **Deps**: mlx-vlm, pillow, fastapi/uvicorn or flask

## 7. Success Criteria (MVP)
- Load model on 36 GB+ Mac without OOM
- Stream a coding response
- Analyze a screenshot and return structured description / code
- Survive 10-turn conversation with vision cache
- Show real-time memory usage
