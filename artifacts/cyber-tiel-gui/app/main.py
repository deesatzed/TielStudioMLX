"""
Minimal FastAPI scaffold for Cyber-Tiel Coder GUI.
Wraps mlx-vlm streaming generation with vision support.
"""
import argparse
import gc
from pathlib import Path

import mlx.core as mx
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from mlx_vlm import load, stream_generate
from mlx_vlm.prompt_utils import apply_chat_template
from mlx_vlm.utils import load_config

app = FastAPI(title="Cyber-Tiel Coder GUI")
app.mount("/static", StaticFiles(directory="static"), name="static")

model = None
processor = None
config = None
model_path: str | None = None


@app.get("/", response_class=HTMLResponse)
async def index():
    return (Path("templates/index.html").read_text())


@app.post("/api/load")
async def load_model(path: str = Form(...)):
    global model, processor, config, model_path
    model, processor = load(path)
    config = load_config(path)
    model_path = path
    mx.metal.set_cache_limit(6 * 1024**3)  # 6 GiB example
    return {"status": "loaded", "path": path}


@app.post("/api/generate")
async def generate(
    prompt: str = Form(...),
    image: UploadFile | None = File(None),
    max_tokens: int = Form(2048),
    temperature: float = Form(0.6),
):
    if model is None:
        return {"error": "Model not loaded"}

    images = []
    if image:
        # Save temp and pass path; thumbnail in production
        tmp = Path("/tmp") / image.filename
        tmp.write_bytes(await image.read())
        images = [str(tmp)]

    formatted = apply_chat_template(
        processor, config, prompt, num_images=len(images)
    )

    def token_stream():
        for chunk in stream_generate(
            model,
            processor,
            formatted,
            image=images or None,
            max_tokens=max_tokens,
            temperature=temperature,
        ):
            yield chunk.text
        gc.collect()
        mx.metal.clear_cache()

    return StreamingResponse(token_stream(), media_type="text/plain")


@app.get("/api/status")
async def status():
    return {
        "loaded": model is not None,
        "model": model_path,
        "metal_cache": "see system monitor",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=None)
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    if args.model:
        # pre-load optional
        pass
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=args.port)
