import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SlidersHorizontal, c as ImagePlus, d as ArrowUp, i as Square, l as Copy, o as Plus, r as Trash2, s as PanelLeft, t as X, u as Check } from "../_libs/lucide-react.mjs";
import { t as formatDistanceToNowStrict } from "../_libs/date-fns.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-H2dQcrsG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function shrinkImage(file) {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
			const width = Math.max(1, Math.round(img.width * scale));
			const height = Math.max(1, Math.round(img.height * scale));
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				URL.revokeObjectURL(url);
				reject(/* @__PURE__ */ new Error("Could not read that image."));
				return;
			}
			ctx.drawImage(img, 0, 0, width, height);
			const dataUrl = canvas.toDataURL("image/jpeg", .72);
			URL.revokeObjectURL(url);
			resolve({
				name: file.name || "screenshot.jpg",
				dataUrl,
				width,
				height
			});
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(/* @__PURE__ */ new Error("Could not read that image."));
		};
		img.src = url;
	});
}
function Inline({ text }) {
	return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
		if (part.startsWith("`") && part.endsWith("`") && part.length > 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rounded-sm bg-surface-2 px-1 font-mono text-sm text-fg",
			children: part.slice(1, -1)
		}, index);
		if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "font-medium text-fg",
			children: part.slice(2, -2)
		}, index);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part }, index);
	});
}
function CodeBlock({ source, lang }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "my-3 overflow-hidden rounded-md border border-line bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-line px-3 py-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs text-subtle",
				children: lang || "text"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "inline-flex h-8 items-center gap-1 rounded-sm px-2 text-xs text-muted hover:bg-surface-2 hover:text-fg",
				onClick: () => {
					navigator.clipboard.writeText(source).then(() => {
						setCopied(true);
						window.setTimeout(() => setCopied(false), 1200);
					});
				},
				children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), copied ? "Copied" : "Copy"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "overflow-x-auto p-3 font-mono text-sm leading-relaxed text-fg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: source.replace(/\n$/, "") })
		})]
	});
}
function Prose({ text }) {
	const lines = text.split("\n");
	const blocks = [];
	let list = [];
	let paragraph = [];
	let key = 0;
	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		const body = paragraph.join(" ").trim();
		paragraph = [];
		if (!body) return;
		blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-base leading-relaxed text-fg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inline, { text: body })
		}, key++));
	};
	const flushList = () => {
		if (list.length === 0) return;
		const items = list;
		list = [];
		blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "list-disc space-y-1 pl-5 text-base leading-relaxed text-fg",
			children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inline, { text: item }) }, index))
		}, key++));
	};
	for (const line of lines) {
		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		const bullet = /^[-*]\s+(.+)$/.exec(line);
		if (heading) {
			flushParagraph();
			flushList();
			const level = heading[1].length;
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("font-medium tracking-tight text-fg", level === 1 ? "text-lg" : "text-base"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inline, { text: heading[2] })
			}, key++));
			continue;
		}
		if (bullet) {
			flushParagraph();
			list.push(bullet[1]);
			continue;
		}
		if (!line.trim()) {
			flushParagraph();
			flushList();
			continue;
		}
		flushList();
		paragraph.push(line.trim());
	}
	flushParagraph();
	flushList();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3",
		children: blocks
	});
}
function Markdown({ text }) {
	const chunks = text.split("```");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3",
		children: chunks.map((chunk, index) => {
			if (index % 2 === 1) {
				const newline = chunk.indexOf("\n");
				const lang = newline === -1 ? "" : chunk.slice(0, newline).trim();
				const source = newline === -1 ? chunk : chunk.slice(newline + 1);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeBlock, {
					lang,
					source
				}, index);
			}
			if (!chunk.trim()) return null;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prose, { text: chunk }, index);
		})
	});
}
var PRESETS = {
	coding: {
		label: "Coding",
		hint: "Direct implementation. Temp 0.6, top-p 0.95, top-k 20.",
		sampling: {
			temperature: .6,
			topP: .95,
			topK: 20,
			maxTokens: 1400
		}
	},
	review: {
		label: "Review",
		hint: "Races, bounds, and insecure defaults. Slightly wider top-k.",
		sampling: {
			temperature: .4,
			topP: .9,
			topK: 40,
			maxTokens: 1400
		}
	},
	vision: {
		label: "Vision",
		hint: "Screenshot first, then the engineering point.",
		sampling: {
			temperature: .3,
			topP: .9,
			topK: 20,
			maxTokens: 900
		}
	}
};
var DEFAULT_MODEL = "peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP";
function blankSession() {
	return {
		id: crypto.randomUUID(),
		title: "New thread",
		updatedAt: Date.now(),
		messages: []
	};
}
var first = blankSession();
function touchTitle(session, messages) {
	if (session.title !== "New thread") return session.title;
	const user = messages.find((m) => m.role === "user" && m.content.trim());
	if (!user) return session.title;
	const line = user.content.trim().replace(/\s+/g, " ");
	return line.length > 52 ? `${line.slice(0, 52)}…` : line;
}
var useStudio = create()(persist((set) => ({
	sessions: [first],
	currentId: first.id,
	sampling: {
		preset: "coding",
		...PRESETS.coding.sampling
	},
	runtime: {
		mode: "preview",
		baseUrl: "http://127.0.0.1:8000",
		model: DEFAULT_MODEL,
		apiKey: ""
	},
	draft: "",
	draftImage: null,
	select: (id) => set({ currentId: id }),
	createSession: () => set((state) => {
		const session = blankSession();
		return {
			sessions: [session, ...state.sessions].slice(0, 24),
			currentId: session.id,
			draft: "",
			draftImage: null
		};
	}),
	deleteSession: (id) => set((state) => {
		const rest = state.sessions.filter((s) => s.id !== id);
		if (rest.length === 0) {
			const session = blankSession();
			return {
				sessions: [session],
				currentId: session.id
			};
		}
		return {
			sessions: rest,
			currentId: state.currentId === id ? rest[0].id : state.currentId
		};
	}),
	setDraft: (draft) => set({ draft }),
	setDraftImage: (draftImage) => set({ draftImage }),
	setSampling: (patch) => set((state) => ({ sampling: {
		...state.sampling,
		...patch
	} })),
	applyPreset: (preset) => set({ sampling: {
		preset,
		...PRESETS[preset].sampling
	} }),
	setRuntime: (patch) => set((state) => ({ runtime: {
		...state.runtime,
		...patch
	} })),
	pushTurn: (sessionId, messages) => set((state) => ({ sessions: state.sessions.map((session) => {
		if (session.id !== sessionId) return session;
		const next = [...session.messages, ...messages].slice(-40);
		return {
			...session,
			messages: next,
			title: touchTitle(session, next),
			updatedAt: Date.now()
		};
	}) })),
	patchMessage: (sessionId, messageId, patch) => set((state) => ({ sessions: state.sessions.map((session) => {
		if (session.id !== sessionId) return session;
		return {
			...session,
			updatedAt: Date.now(),
			messages: session.messages.map((message) => message.id === messageId ? {
				...message,
				...patch
			} : message)
		};
	}) }))
}), {
	name: "cyber-tiel-studio",
	skipHydration: true,
	storage: createJSONStorage(() => localStorage),
	partialize: (state) => ({
		sessions: state.sessions.map((session) => ({
			...session,
			messages: session.messages.map((message) => ({
				...message,
				attachments: message.attachments?.map((item) => ({
					name: item.name,
					width: item.width,
					height: item.height
				}))
			}))
		})),
		currentId: state.currentId,
		sampling: state.sampling,
		runtime: state.runtime
	})
}));
function toTurns(messages) {
	return messages.filter((message) => message.role === "user" || message.content.trim()).map((message) => ({
		role: message.role,
		content: message.content,
		images: imagesOf(message.attachments)
	}));
}
function imagesOf(attachments) {
	const urls = (attachments ?? []).map((item) => item.dataUrl).filter((url) => Boolean(url));
	return urls.length > 0 ? urls : void 0;
}
async function readCompletion(response, onText) {
	if ((response.headers.get("content-type") ?? "").includes("application/json")) {
		const body = await response.json();
		if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
		const text = body.choices?.[0]?.message?.content ?? "";
		onText(text);
		return text;
	}
	if (!response.ok || !response.body) throw new Error(`Request failed (${response.status})`);
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed.startsWith("data:")) continue;
			const data = trimmed.slice(5).trim();
			if (!data || data === "[DONE]") continue;
			try {
				const json = JSON.parse(data);
				if (json.error?.message) throw new Error(json.error.message);
				const piece = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? "";
				if (piece) {
					full += piece;
					onText(full);
				}
			} catch (error) {
				if (error instanceof SyntaxError) continue;
				throw error;
			}
		}
	}
	return full;
}
async function completeLocal(options) {
	const base = options.runtime.baseUrl.trim().replace(/\/$/, "");
	if (!base) throw new Error("Add the runtime URL first.");
	const endpoint = `${base}/v1/chat/completions`;
	const body = {
		model: options.runtime.model.trim() || "cyber-tiel",
		stream: true,
		temperature: options.sampling.temperature,
		top_p: options.sampling.topP,
		max_tokens: options.sampling.maxTokens,
		messages: localMessages(options.turns, options.focus)
	};
	const headers = { "Content-Type": "application/json" };
	if (options.runtime.apiKey.trim()) headers.Authorization = `Bearer ${options.runtime.apiKey.trim()}`;
	let response;
	try {
		response = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify({
				...body,
				top_k: options.sampling.topK
			}),
			signal: options.signal
		});
	} catch (error) {
		if (options.signal.aborted) throw error;
		throw new Error("The browser could not reach that runtime. It may be offline, or it is blocking this page.");
	}
	if (response.status === 400) response = await fetch(endpoint, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: options.signal
	});
	if (!response.ok) throw new Error(localError(response.status));
	return readCompletion(response, options.onText);
}
function localError(status) {
	if (status === 401 || status === 403) return "The runtime rejected the key.";
	if (status === 404) return "That URL has no /v1/chat/completions endpoint.";
	return `Runtime refused the request (${status}). If this is oMLX or mlx-vlm, allow this page's origin.`;
}
function localMessages(turns, focus) {
	return [{
		role: "system",
		content: `You are Cyber-Tiel, a local agentic coding model. ${focus === "review" ? "Review for races, bounds, and insecure defaults, then show a patch." : focus === "vision" ? "If an image is present, describe what is on screen before suggesting code." : "Implement directly. Prefer a complete snippet."} Use fenced code blocks. Do not write malware or intrusion steps.`
	}, ...turns.map((turn, index) => {
		const last = index === turns.length - 1;
		if (turn.role === "user" && last && turn.images?.length) return {
			role: "user",
			content: [{
				type: "text",
				text: turn.content
			}, ...turn.images.map((url) => ({
				type: "image_url",
				image_url: { url }
			}))]
		};
		const note = turn.images?.length ? "\n[screenshot attached]" : "";
		return {
			role: turn.role,
			content: `${turn.content}${note}`
		};
	})];
}
async function completePreview(options) {
	const response = await fetch("/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		signal: options.signal,
		body: JSON.stringify({
			focus: options.sampling.preset,
			temperature: options.sampling.temperature,
			topP: options.sampling.topP,
			maxTokens: options.sampling.maxTokens,
			messages: options.turns.map((turn) => ({
				role: turn.role,
				content: turn.content.slice(0, 12e3),
				images: turn.images?.slice(0, 1)
			}))
		})
	});
	if (!response.ok && (response.headers.get("content-type") ?? "").includes("application/json")) {
		const body = await response.json();
		throw new Error(body.error || `Preview failed (${response.status})`);
	}
	return readCompletion(response, options.onText);
}
var STARTERS = [
	{
		title: "Patch a handler",
		body: "Diff two unified patches and return added lines.",
		preset: "coding",
		prompt: "Write a Python function that takes two unified diffs and returns the added line numbers per file. Include a short doctest."
	},
	{
		title: "Review a race",
		body: "A cache fill that is not safe under concurrency.",
		preset: "review",
		prompt: "Review this pattern for races and missing bounds checks, then show a patched version:\n\ncache = {}\nasync def get_user(uid):\n    if uid not in cache:\n        cache[uid] = await db.fetch(uid)\n    return cache[uid]"
	},
	{
		title: "Wire mlx-vlm",
		body: "A streaming route for the local checkpoint.",
		preset: "vision",
		prompt: "Sketch a small FastAPI route that streams tokens from mlx_vlm.stream_generate, accepts one optional image, and clears the Metal cache when the stream ends. Python only. Do not use mlx_lm.load."
	}
];
function uid() {
	return crypto.randomUUID();
}
function Studio() {
	const sessions = useStudio((s) => s.sessions);
	const currentId = useStudio((s) => s.currentId);
	const sampling = useStudio((s) => s.sampling);
	const runtime = useStudio((s) => s.runtime);
	const draft = useStudio((s) => s.draft);
	const draftImage = useStudio((s) => s.draftImage);
	const select = useStudio((s) => s.select);
	const createSession = useStudio((s) => s.createSession);
	const deleteSession = useStudio((s) => s.deleteSession);
	const setDraft = useStudio((s) => s.setDraft);
	const setDraftImage = useStudio((s) => s.setDraftImage);
	const setSampling = useStudio((s) => s.setSampling);
	const applyPreset = useStudio((s) => s.applyPreset);
	const setRuntime = useStudio((s) => s.setRuntime);
	const pushTurn = useStudio((s) => s.pushTurn);
	const patchMessage = useStudio((s) => s.patchMessage);
	const [drawer, setDrawer] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [previewOk, setPreviewOk] = (0, import_react.useState)(null);
	const [imageError, setImageError] = (0, import_react.useState)("");
	const abortRef = (0, import_react.useRef)(null);
	const scrollerRef = (0, import_react.useRef)(null);
	const stickRef = (0, import_react.useRef)(true);
	const fileRef = (0, import_react.useRef)(null);
	const session = sessions.find((item) => item.id === currentId) ?? sessions[0];
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		fetch("/api/status").then((res) => res.json()).then((body) => {
			if (!cancelled) setPreviewOk(Boolean(body.preview));
		}).catch(() => {
			if (!cancelled) setPreviewOk(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!stickRef.current) return;
		const node = scrollerRef.current;
		if (!node) return;
		node.scrollTop = node.scrollHeight;
	}, [
		session?.messages,
		busy,
		draft
	]);
	if (!session) return null;
	const tokens = Math.round((session.messages.reduce((n, m) => n + m.content.length, 0) + draft.length) / 4 + (draftImage ? 800 : 0));
	const budget = Math.min(100, tokens / 32e3 * 100);
	async function onPick(file) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setImageError("Use a PNG, JPEG, or WebP screenshot.");
			return;
		}
		try {
			setImageError("");
			setDraftImage(await shrinkImage(file));
		} catch (error) {
			setImageError(error instanceof Error ? error.message : "Could not read that image.");
		}
	}
	async function send(text, preset) {
		const content = text.trim();
		if (!content || busy) return;
		if (preset) applyPreset(preset);
		const active = preset ? {
			preset,
			...PRESETS[preset].sampling
		} : useStudio.getState().sampling;
		const runtimeNow = useStudio.getState().runtime;
		const sessionId = useStudio.getState().currentId;
		const prior = useStudio.getState().sessions.find((s) => s.id === sessionId)?.messages ?? [];
		const image = useStudio.getState().draftImage;
		const user = {
			id: uid(),
			role: "user",
			content,
			createdAt: Date.now(),
			attachments: image ? [image] : void 0
		};
		const assistantId = uid();
		pushTurn(sessionId, [user, {
			id: assistantId,
			role: "assistant",
			content: "",
			createdAt: Date.now()
		}]);
		setDraft("");
		setDraftImage(null);
		setBusy(true);
		stickRef.current = true;
		const controller = new AbortController();
		abortRef.current = controller;
		const started = performance.now();
		let acc = "";
		let frame = 0;
		const paint = (full) => {
			acc = full;
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				patchMessage(sessionId, assistantId, { content: acc });
			});
		};
		try {
			const turns = toTurns([...prior, user]);
			const finalText = await (runtimeNow.mode === "local" ? completeLocal({
				runtime: runtimeNow,
				sampling: active,
				turns,
				focus: active.preset,
				signal: controller.signal,
				onText: paint
			}) : completePreview({
				sampling: active,
				turns,
				signal: controller.signal,
				onText: paint
			}));
			if (frame) cancelAnimationFrame(frame);
			patchMessage(sessionId, assistantId, {
				content: finalText,
				ms: Math.round(performance.now() - started)
			});
		} catch (error) {
			if (frame) cancelAnimationFrame(frame);
			const stopped = controller.signal.aborted;
			patchMessage(sessionId, assistantId, {
				content: acc,
				ms: Math.round(performance.now() - started),
				error: stopped ? acc ? void 0 : "Stopped." : error instanceof Error ? error.message : "The turn failed."
			});
		} finally {
			setBusy(false);
			abortRef.current = null;
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg lg:hidden",
						"aria-label": "Threads",
						onClick: () => setDrawer("sessions"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeft, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0 flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate text-lg font-medium tracking-tight",
								children: "Cyber-Tiel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted",
								children: "Studio"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden font-mono text-xs text-subtle xl:block",
						children: "35B-A3B · oQ6e · mlx-vlm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg xl:hidden",
						"aria-label": "Sampling and runtime",
						onClick: () => setDrawer("inspector"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-5" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionColumn, {
						className: "hidden lg:flex",
						sessions,
						currentId: session.id,
						onSelect: select,
						onCreate: createSession,
						onDelete: deleteSession
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "flex min-w-0 flex-1 flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: scrollerRef,
							onScroll: (event) => {
								const node = event.currentTarget;
								stickRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
							},
							className: "min-h-0 flex-1 overflow-y-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6",
								children: session.messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { onPick: (item) => {
									applyPreset(item.preset);
									send(item.prompt, item.preset);
								} }) : session.messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageView, {
									message,
									streaming: busy && message.id === session.messages.at(-1)?.id
								}, message.id))
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
							className: "shrink-0 border-t border-line px-3 py-3 sm:px-4",
							onSubmit: (event) => {
								event.preventDefault();
								send(draft);
							},
							onDragOver: (event) => event.preventDefault(),
							onDrop: (event) => {
								event.preventDefault();
								onPick(event.dataTransfer.files[0]);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-3",
								children: [
									draftImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageChip, {
										image: draftImage,
										onClear: () => setDraftImage(null)
									}) : null,
									imageError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mb-2 text-sm text-muted",
										children: imageError
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "sr-only",
										htmlFor: "prompt",
										children: "Message"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										id: "prompt",
										value: draft,
										rows: 3,
										placeholder: "Ask for a patch, a review, or what is in a screenshot.",
										className: "w-full resize-none rounded-md bg-transparent px-1 text-base leading-relaxed text-fg outline-none placeholder:text-subtle",
										onChange: (event) => setDraft(event.target.value),
										onKeyDown: (event) => {
											if (event.key === "Enter" && !event.shiftKey) {
												event.preventDefault();
												send(draft);
											}
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg",
													"aria-label": "Attach screenshot",
													onClick: () => fileRef.current?.click(),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-5" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													ref: fileRef,
													type: "file",
													accept: "image/png,image/jpeg,image/webp,image/gif",
													className: "hidden",
													onChange: (event) => {
														onPick(event.target.files?.[0]);
														event.target.value = "";
													}
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "hidden gap-1 sm:flex",
													children: Object.keys(PRESETS).map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => applyPreset(preset),
														className: cn("h-9 rounded-full px-3 text-sm", sampling.preset === preset ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"),
														children: PRESETS[preset].label
													}, preset))
												})
											]
										}), busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "inline-flex size-11 items-center justify-center rounded-md bg-accent text-accent-fg",
											"aria-label": "Stop",
											onClick: () => abortRef.current?.abort(),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-4" })
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											disabled: !draft.trim(),
											className: "inline-flex size-11 items-center justify-center rounded-md bg-accent text-accent-fg disabled:opacity-40",
											"aria-label": "Send",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-5" })
										})]
									})
								]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {
						className: "hidden xl:flex",
						samplingPreset: sampling.preset,
						temperature: sampling.temperature,
						topP: sampling.topP,
						topK: sampling.topK,
						maxTokens: sampling.maxTokens,
						onSampling: setSampling,
						onPreset: applyPreset,
						runtimeMode: runtime.mode,
						baseUrl: runtime.baseUrl,
						model: runtime.model,
						apiKey: runtime.apiKey,
						onRuntime: setRuntime,
						tokens,
						budget,
						previewOk
					})
				]
			}),
			drawer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-30 xl:hidden",
				role: "dialog",
				"aria-modal": "true",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute inset-0 bg-bg/80",
					"aria-label": "Close",
					onClick: () => setDrawer(null)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col border-r border-line bg-bg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-14 items-center justify-end px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "inline-flex size-11 items-center justify-center rounded-md text-muted",
							"aria-label": "Close panel",
							onClick: () => setDrawer(null),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
						})
					}), drawer === "sessions" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionColumn, {
						className: "flex min-h-0 flex-1",
						sessions,
						currentId: session.id,
						onSelect: (id) => {
							select(id);
							setDrawer(null);
						},
						onCreate: () => {
							createSession();
							setDrawer(null);
						},
						onDelete: deleteSession
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {
						className: "flex min-h-0 flex-1 overflow-y-auto",
						samplingPreset: sampling.preset,
						temperature: sampling.temperature,
						topP: sampling.topP,
						topK: sampling.topK,
						maxTokens: sampling.maxTokens,
						onSampling: setSampling,
						onPreset: applyPreset,
						runtimeMode: runtime.mode,
						baseUrl: runtime.baseUrl,
						model: runtime.model,
						apiKey: runtime.apiKey,
						onRuntime: setRuntime,
						tokens,
						budget,
						previewOk
					})]
				})]
			}) : null
		]
	});
}
function Empty({ onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 pt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tracking-wide text-subtle",
					children: "CHECKPOINT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 text-2xl font-medium tracking-tight",
					children: "A cockpit for the 35B coder."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-base leading-relaxed text-muted",
					children: "Cyber-Tiel is a vision MoE for agentic coding. This studio streams a preview brain until you point it at mlx-vlm or oMLX on your Mac."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: STARTERS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onPick(item),
				className: "rounded-lg border border-line bg-surface p-4 text-left hover:bg-surface-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm font-medium",
					children: item.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-sm leading-relaxed text-muted",
					children: item.body
				})]
			}, item.title))
		})]
	});
}
function MessageView({ message, streaming }) {
	if (message.role === "user") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ml-auto w-full max-w-xl rounded-lg bg-surface-2 px-4 py-3",
		children: [message.attachments?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
			className: "mb-3",
			children: [item.dataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: item.dataUrl,
				alt: "",
				className: "max-h-48 w-full rounded-md object-contain"
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
				className: "mt-1 font-mono text-xs text-subtle",
				children: [item.name, item.width ? ` · ${item.width}×${item.height}` : ""]
			})]
		}, item.name)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "whitespace-pre-wrap text-base leading-relaxed",
			children: message.content
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-subtle",
				children: "Cyber-Tiel"
			}), message.ms ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-xs tabular-nums text-subtle",
				children: [message.ms, " ms"]
			}) : null]
		}),
		streaming && !message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-base text-muted",
			children: "Drafting"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { text: message.content }),
		streaming && message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "caret ml-0.5 text-muted",
			"aria-hidden": "true",
			children: "|"
		}) : null,
		message.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: message.error
		}) : null
	] });
}
function ImageChip({ image, onClear }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-2 flex items-center gap-3 rounded-md bg-surface-2 p-2",
		children: [
			image.dataUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: image.dataUrl,
				alt: "",
				className: "h-12 w-16 rounded-sm object-cover"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm",
					children: image.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs text-subtle",
					children: [
						image.width,
						"×",
						image.height
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "inline-flex size-11 items-center justify-center rounded-md text-muted",
				"aria-label": "Remove screenshot",
				onClick: onClear,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})
		]
	});
}
function SessionColumn({ className, sessions, currentId, onSelect, onCreate, onDelete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("min-h-0 w-64 min-w-64 max-w-64 shrink-0 basis-64 flex-col overflow-hidden border-r border-line", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-3 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-subtle",
				children: "THREADS"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg",
				"aria-label": "New thread",
				onClick: onCreate,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4",
			children: sessions.map((item) => {
				const active = item.id === currentId;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("group mb-1 flex items-stretch rounded-md", active ? "bg-surface-2" : "hover:bg-surface"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onSelect(item.id),
						className: "min-w-0 flex-1 px-3 py-2 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm",
							children: item.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block font-mono text-xs text-subtle",
							children: item.updatedAt > Date.now() - 15e3 ? "Just now" : formatDistanceToNowStrict(item.updatedAt, { addSuffix: true })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": `Delete ${item.title}`,
						className: "inline-flex w-11 items-center justify-center text-subtle hover:text-fg sm:opacity-0 sm:group-hover:opacity-100",
						onClick: () => onDelete(item.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})]
				}, item.id);
			})
		})]
	});
}
function Inspector(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: cn("min-h-0 w-80 min-w-80 max-w-80 shrink-0 basis-80 flex-col overflow-hidden border-l border-line", props.className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs text-subtle",
						children: "RUNTIME"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [["preview", "Preview"], ["local", "Mac runtime"]].map(([mode, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => props.onRuntime({ mode }),
							className: cn("h-11 rounded-md border text-sm", props.runtimeMode === mode ? "border-line bg-surface-2 text-fg" : "border-transparent text-muted hover:text-fg"),
							children: label
						}, mode))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-muted",
						children: props.runtimeMode === "preview" ? props.previewOk === false ? "Preview inference is unavailable here. Switch to the Mac runtime." : "Preview uses a capped stand-in so you can work before the 30 GB checkpoint is loaded." : "OpenAI-compatible base URL. oMLX is usually port 8000. Load this checkpoint with mlx-vlm, not mlx-lm."
					}),
					props.runtimeMode === "local" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Base URL",
								value: props.baseUrl,
								onChange: (baseUrl) => props.onRuntime({ baseUrl })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Model id",
								value: props.model,
								onChange: (model) => props.onRuntime({ model })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "API key",
								value: props.apiKey,
								secret: true,
								onChange: (apiKey) => props.onRuntime({ apiKey })
							})
						]
					}) : null
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs text-subtle",
						children: "SAMPLING"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: PRESETS[props.samplingPreset].hint
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-1",
						children: Object.keys(PRESETS).map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => props.onPreset(preset),
							className: cn("h-9 rounded-full px-3 text-sm", props.samplingPreset === preset ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"),
							children: PRESETS[preset].label
						}, preset))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderField, {
						label: "Temperature",
						value: props.temperature,
						min: 0,
						max: 1.2,
						step: .05,
						format: (n) => n.toFixed(2),
						onChange: (temperature) => props.onSampling({ temperature })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderField, {
						label: "Top-p",
						value: props.topP,
						min: .1,
						max: 1,
						step: .01,
						format: (n) => n.toFixed(2),
						onChange: (topP) => props.onSampling({ topP })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderField, {
						label: "Top-k",
						value: props.topK,
						min: 1,
						max: 80,
						step: 1,
						format: (n) => String(Math.round(n)),
						onChange: (topK) => props.onSampling({ topK: Math.round(topK) })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderField, {
						label: "Max tokens",
						value: props.maxTokens,
						min: 128,
						max: 2048,
						step: 64,
						format: (n) => String(Math.round(n)),
						onChange: (maxTokens) => props.onSampling({ maxTokens: Math.round(maxTokens) })
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs text-subtle",
							children: "TURN BUDGET"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-xs tabular-nums text-muted",
							children: [tokensLabel(props.tokens), " / 32k"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 h-1 overflow-hidden rounded-full bg-surface-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-accent",
							style: { width: `${props.budget}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-muted",
						children: "The checkpoint holds 262k. Preview turns stay inside 2k output tokens."
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border-t border-line pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs text-subtle",
							children: "CHECKPOINT"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-3 space-y-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "Weights",
									v: "35B MoE, ~3.4B active"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "Quant",
									v: "oQ6e, about 30 GB"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "Loader",
									v: "mlx-vlm only"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "Vision",
									v: "Built-in tower"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
									k: "Memory",
									v: "Comfortable on 36 GB"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted",
							children: "Abliterated weights. Keep the Mac process sandboxed. LM Studio mishandles this MTP build."
						})
					]
				})
			]
		})
	});
}
function Fact({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "max-w-44 text-right text-fg",
			children: v
		})]
	});
}
function Field({ label, value, onChange, secret }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-xs text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: secret ? "password" : "text",
			value,
			autoComplete: "off",
			onChange: (event) => onChange(event.target.value),
			className: "h-11 w-full rounded-md border border-line bg-bg px-3 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
		})]
	});
}
function SliderField({ label, value, min, max, step, format, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mt-4 block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-baseline justify-between text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs tabular-nums text-fg",
				children: format(value)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value,
			onChange: (event) => onChange(Number(event.target.value)),
			className: "mt-2 h-11 w-full accent-accent"
		})]
	});
}
function tokensLabel(tokens) {
	if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}k`;
	return String(tokens);
}
function Home() {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		Promise.resolve(useStudio.persist.rehydrate()).finally(() => {
			if (cancelled) return;
			const { sessions, currentId, select } = useStudio.getState();
			if (!sessions.some((session) => session.id === currentId) && sessions[0]) select(sessions[0].id);
			setReady(true);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
function Frame() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-dvh flex-col bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex h-14 items-center border-b border-line px-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-medium tracking-tight",
				children: "Cyber-Tiel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-2 text-sm text-muted",
				children: "Studio"
			})]
		})
	});
}
//#endregion
export { Home as component };
