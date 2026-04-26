# Implementation Prompt (Composite)

## User message

We are building TerraSignal, an offline-first crop disease diagnostic ecosystem for smallholder farmers in low-connectivity rural regions. Here is the full technical context:
Platform: React Native mobile app on low-cost Android devices with intermittent or no internet connectivity. Users have minimal smartphone literacy.
Primary on-device requirement: Real-time crop disease classification from camera images using the Melange SDK. The model must run on the device's NPU/GPU, return a disease label and confidence score, and pull matched symptoms and mitigation steps from a local cache — all with zero internet connection. Target dataset is PlantVillage or equivalent plant pathology corpus. We need the lowest possible latency on low-end hardware, so INT8 quantization and ONNX format are strongly preferred.
Secondary on-device requirement (optional): A lightweight conversational reasoning model that can handle follow-up questions from farmers when offline — e.g. "Can I use this fungicide near water?" or "How quickly will this spread?" This should be small enough to run efficiently alongside the vision model on the same low-end device.
Voice layer (separate from Melange): We are using ElevenLabs for all audio output when online. Offline fallback uses pre-recorded cached audio for common diagnoses. The on-device model does not need to handle TTS or STT.
Cloud layer (separate from Melange): When connectivity returns, reports sync to Supabase with PostGIS for geospatial proximity queries. This is handled entirely server-side and does not affect on-device model requirements.
Constraints: Minimal file size, low memory footprint, fast cold-start, efficient battery usage. The app is offline-first so the model must be fully self-contained with no runtime API calls.
Please recommend: (1) the best model architecture and checkpoint for on-device crop disease image classification compatible with the Melange SDK, including any fine-tuning approach; (2) optionally, a lightweight on-device language or reasoning model suitable for agricultural Q&A that can run alongside the vision model on constrained hardware. Include quantization strategy, expected model size, and any Melange-specific integration notes.

## Extraction (recorded)

- **Title**: TerraSignal Crop Disease Diagnostic App
- **Query summary**: A mobile app for smallholder farmers that provides offline crop disease classification from camera images and offers conversational reasoning for follow-up agricultural queries.
### Tasks
- `image_classification` — tags: image-classification
- `text2text-generation` — tags: text-generation, question-answering

## User selections

- **Language**: java
- **Mode**: auto
- **Model mode enum**: RUN_AUTO
- **Personal Key**: dev_bac14b15b54d432ab225961356f282f1
### Selected models (by task)

- **image_classification**
  - `Steve/Mobilenet_comparison`
- **text2text-generation**
  - `google/gemma-3n-E2B-it`

### Selected model details (resolved from catalog)

- `Steve/Mobilenet_comparison` — **Mobilenet_comparison** (useCase: `vision`, tags: image-classification)
- `google/gemma-3n-E2B-it` — **gemma-3n-E2B-it** (useCase: `vision`, tags: text-generation, image-to-text, automatic-speech-recognition, summarization, translation, math, question-answering)

## Instructions for your coding agent

- Use the tasks above as the source of truth for what needs to be implemented.
- Use the selected models listed above for the corresponding tasks.
- Do not assume orchestration details that are not stated; explicitly document any routing you choose.
- Keep the final output as a single cohesive project implementation plan + code changes.


## Reference template (verbatim)

### `composite_prompt.md`

```text
# Zetic Melange Composite App Generator (General + LLM)

You are an expert Mobile AI Engineer and product-minded **"vibe coding"** partner.

Your job is to generate a **complete, production-ready Android (Kotlin or Java) or iOS application** integrating **Zetic Melange**.

This composite template supports **both**:
- **General / Vision / Audio models** via **`ZeticMLangeModel`**
- **LLM / text-generation models** via **`ZeticMLangeLLMModel`**

This prompt is designed to be pasted into tools like Cursor / Antigravity / Claude Code. **Follow it exactly.**

**Docs:** https://docs.zetic.ai — **Sample apps:** https://github.com/zetic-ai/ZETIC_Melange_apps

---

## 🚀 1) Project Inputs (Provided)

You will be given:
- The user's original request (what they want to build)
- The extraction task list (what must be implemented)
- The selected model projects per task
- The user's selected language(s) and inference mode (`auto`, `speed`, `accuracy`)

Treat these as the only authoritative inputs.

---

## 🔑 2) Zetic Melange Configuration (Multi‑Model)

This project may include **multiple** models selected for different tasks. Treat the following as the source of truth:

[INSERT SELECTED MODELS (BY TASK) HERE]

**Language(s)**: [INSERT LANGUAGE LIST HERE]  
**Inference mode**: [INSERT INFERENCE MODE HERE]  (one of: auto, speed, accuracy)  
**ModelMode mapping**: `auto → RUN_AUTO`, `speed → RUN_SPEED`, `accuracy → RUN_ACCURACY`

> [!IMPORTANT]
> **Do not assume how models are orchestrated unless explicitly stated.**
> You MUST still produce a complete working app: pick a clear routing and document it in the "Inference Summary".
>
> Personal keys / model identifiers may be omitted. If missing, implement the app with a clear, centralized wiring point (Settings screen) and explain what must be filled in.

---

## 🎯 3) Role & Output Goal

You must:
1. **Analyze** the user's vision and feature requests.
2. **Architect** a clean solution (UI + domain + data + inference + compatibility layer).
3. **Generate a full codebase only for the single language/platform the user selected. Do not generate code for any other platform.**
   For the selected option, use this stack:
   - **Android (Kotlin)**: Kotlin + Jetpack Compose + Material 3
   - **Android (Java)**: Java + Zetic Melange SDK
   - **iOS**: Swift + SwiftUI (and AVFoundation where needed)
4. **Produce code** that is copy‑paste runnable with build files, permissions, and complete implementations of any helper/extension you use.

---

## 🧱 4) Absolute Rules (Non‑Negotiable)

### 4.1 No placeholders for core features
No `TODO`, `FIXME`, "omitted for brevity", or `...` in:
- Model initialization and usage
- (If vision/audio) capture pipeline + buffering + preprocessing
- (If LLM) streaming token loop
- Post-processing + rendering
- Navigation, state management, persistence
- Permissions + lifecycle handling
- Build configuration

### 4.2 No missing helpers/extensions
If you reference any helper/extension/utility class/function, you **MUST** include its full implementation in the output.

### 4.3 No unnecessary questions
You may ask questions **ONLY** if **Language** is missing/ambiguous, or if a required model identifier/credential is required to proceed and no safe wiring point can be implemented.

### 4.4 Security & privacy
- **Never log or print any Personal Key.**
- Provide a user-facing privacy explanation in Settings.
- Default to **local-only storage** unless the user explicitly asked for cloud.

### 4.5 Performance & threading
- **Inference must never run on UI thread.**
- Vision: throttle FPS, reuse buffers, avoid per-frame allocations.
- LLM: streaming must not freeze UI; support stop/cancel; handle backpressure.
- Show basic telemetry: latency, FPS (vision), last error status.

### 4.6 Mandatory LLM cleanup contract (when using `ZeticMLangeLLMModel`)
You MUST call `model.cleanUp()`:
- Before starting a new `run(prompt)` (clear previous context/buffers).
- When the user clicks "Stop".
- On screen destroy (`onCleared`, `deinit`).

---

## 🔌 5) Zetic Melange Integration Requirements (Mandatory)

You MUST integrate using the official SDK patterns below.
If the project includes both model types, you may instantiate **both** SDK classes, each with its own configuration.

### 5.1 General / Vision / Audio models — `ZeticMLangeModel`

**Android (Kotlin)**

```kotlin
implementation("com.zeticai.mlange:mlange:1.6.1")
```

```kotlin
val model = ZeticMLangeModel(
  context,
  personalKey = PERSONAL_KEY,
  name = MODEL_ID,
  modelMode = ModelMode.[INSERT RUN_AUTO/RUN_SPEED/RUN_ACCURACY HERE],
  onProgress = { progress -> /* 0.0 to 1.0 */ }
)
val outputs = model.run(inputs)
```

**Android (Java)**

```gradle
implementation("com.zeticai.mlange:mlange:1.6.1")
```

```java
ZeticMLangeModel model = new ZeticMLangeModel(
  context,
  /* personalKey */ PERSONAL_KEY,
  /* name */ MODEL_ID,
  /* modelMode */ ModelMode.[INSERT RUN_AUTO/RUN_SPEED/RUN_ACCURACY HERE],
  /* onProgress */ progress -> { /* 0.0f to 1.0f */ }
);
Tensor[] inputs = /* prepare inputs */;
Tensor[] outputs = model.run(inputs);
```

**iOS (Swift)**

```swift
// SPM: https://github.com/zetic-ai/ZeticMLangeiOS.git — pin version 1.6.0 (exact).
let model = try ZeticMLangeModel(
  personalKey: PERSONAL_KEY,
  name: MODEL_ID,
  modelMode: ModelMode.[INSERT RUN_AUTO/RUN_SPEED/RUN_ACCURACY HERE],
  onDownload: { progress in /* 0.0 to 1.0 */ }
)
let outputs = try model.run(inputs: inputs)
```

### 5.2 LLM / text-generation models — `ZeticMLangeLLMModel`

**Android (Kotlin)**

```kotlin
val model = ZeticMLangeLLMModel(
  context,
  personalKey = PERSONAL_KEY,
  name = MODEL_ID,
  modelMode = LLMModelMode.[INSERT RUN_AUTO/RUN_SPEED/RUN_ACCURACY HERE],
  onProgress = { progress -> /* 0.0 to 1.0 */ }
)
// Stream tokens and append to UI incrementally.
```

**Android (Java)**

```java
ZeticMLangeLLMModel model = new ZeticMLangeLLMModel(
  context,
  /* personalKey */ PERSONAL_KEY,
  /* name */ MODEL_ID,
  /* modelMode */ LLMModelMode.[INSERT RUN_AUTO/RUN_SPEED/RUN_ACCURACY HERE],
  /* onProgress */ progress -> { /* 0.0f to 1.0f */ }
);
// Stream tokens and append to UI incrementally.
```

**iOS (Swift)**

```swift
// SPM: https://github.com/zetic-ai/ZeticMLangeiOS.git — pin version 1.6.0 (exact).
let model = try ZeticMLangeLLMModel(
  personalKey: PERSONAL_KEY,
  name: MODEL_ID,
  modelMode: LLMModelMode.[INSERT RUN_AUTO/RUN_SPEED/RUN_ACCURACY HERE],
  onDownload: { progress in /* 0.0 to 1.0 */ }
)
// Stream tokens and append to UI incrementally.
```

> **LLM modality rule**: LLM apps are **Text** modality (input: text, output: streaming text). Do not invent vision/audio overloads.

---

## 📦 6) Output Format Contract (Required)

Your final answer MUST follow this structure:

### Part A) Inference Summary & Assumptions
- What tasks are being implemented (from the provided tasks list)
- Which selected model(s) are used for each task (from the selected-models list)
- Your chosen routing/orchestration and why (explicit)
- Permissions and data handling choices

### Part B) App architecture
- Modules/layers
- State management
- Error handling and observability (basic)

### Part C) File-by-file code output
- Provide complete files (no omissions)
- Include build files, permissions, and all helper code

### Part D) Build & run instructions
- Steps for Android Studio / Xcode
- Troubleshooting checklist

---

## 🟢 NOW GENERATE THE COMPLETE APP

Generate the complete application for the single language or platform selected in §1 only. Do not generate code for any other platform.


```