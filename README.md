<div align="center">

# 🎙️ Maya — AI Voice Collections Agent
### Kapture Finance × Vapi.ai

**An autonomous outbound voicebot that verifies, negotiates, and resolves overdue collections calls — compliantly, every time.**

[![Built with Vapi](https://img.shields.io/badge/Built%20with-Vapi.ai-5C4EE5?style=flat-square)](https://vapi.ai)
[![LLM](https://img.shields.io/badge/LLM-GPT--4o-10A37F?style=flat-square)](https://openai.com)
[![STT](https://img.shields.io/badge/STT-Deepgram%20Nova--2-13EF93?style=flat-square)](https://deepgram.com)
[![TTS](https://img.shields.io/badge/TTS-ElevenLabs-000000?style=flat-square)](https://elevenlabs.io)
[![Node](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Demo%20Project-lightgrey?style=flat-square)]()

**🎥 [Watch the Demo Video](#-demo-video)** &nbsp;|&nbsp; 📄 [Read the Full HLD](docs/HLD_Document.md) &nbsp;|&nbsp; 🧪 [View Test Cases](tests/test_cases.json)

</div>

---

## 🎥 Demo Video

> **➡️ PASTE YOUR LINK HERE:** https://drive.google.com/file/d/13bypAmqOrMJIstgd2C0l6ND229Zd3-w3/view?usp=drive_link

The demo covers:
- ✅ **Happy Path** — greeting → identity verification → debt disclosure → Promise-to-Pay → payment link sent
- ⚠️ **Edge Case** — already-paid / dispute / do-not-call handling

---

## 💡 What Maya Does

Maya is an outbound Voice AI collections agent that calls customers about overdue EMIs. She:

| | |
|---|---|
| 🔒 **Never discloses debt** | until identity is verified via a locked state-machine gate |
| 🤝 **Negotiates in real time** | Promise-to-Pay, hardship, dispute, already-paid, or opt-out |
| 📋 **Logs every outcome** | structured dispositions via tool calls, no manual notes |
| ⚖️ **Stays compliant** | RBI Fair Practices tone, zero threats, instant DNC honoring |
| 🌐 **Handles edge cases** | abusive callers, silence, wrong numbers, bilingual switches |

---

## 📁 Repository Structure

```
kapture-collections-voicebot/
├── README.md                    ← you are here
├── docs/
│   ├── HLD_Document.md          📄 Full High-Level Design (architecture, state machine, compliance)
│   └── System_Architecture.png  🖼️  (optional — see note below)
├── vapi/
│   ├── system_prompt.txt        🧠 Production Vapi system prompt
│   └── tool_definitions.json    🔧 Tool schemas registered in Vapi
├── mock-server/
│   ├── package.json
│   ├── server.js                🌐 Node.js Express webhook implementation
│   └── .env.example
└── tests/
    └── test_cases.json          🧪 Evaluation matrix — 11 scenarios, happy path + edge cases
```

> **📌 Note on the architecture diagram:** it's authored as Mermaid source directly inside `docs/HLD_Document.md` (Section 2.2), so it renders natively on GitHub — no extra file needed. Want a standalone PNG anyway?
> ```bash
> npm install -g @mermaid-js/mermaid-cli
> mmdc -i architecture.mmd -o docs/System_Architecture.png -b white
> ```

---

## 🚀 Quick Start

### 1️⃣ Run the mock webhook server

```bash
cd mock-server
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm start
```
> Server runs on `http://localhost:3000` · webhook lives at `POST /webhook`

### 2️⃣ Expose it publicly with ngrok

```bash
ngrok http 3000
```
> Copy the forwarding URL, e.g. `https://abcd1234.ngrok-free.app`

### 3️⃣ Configure the Vapi Assistant

| Setting | Value |
|---|---|
| **Transcriber** | Deepgram · `nova-2` · `en-US` (or `multi` for bilingual) |
| **Model** | OpenAI `gpt-4o` · temperature `0.1` |
| **Voice** | ElevenLabs / Cartesia — e.g. *"Sarah"* or *"Rachel"* |
| **System Prompt** | paste from [`vapi/system_prompt.txt`](vapi/system_prompt.txt) |
| **First Message** | `Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?` |
| **Tools** | import [`vapi/tool_definitions.json`](vapi/tool_definitions.json), point each to `<ngrok-url>/webhook` |

### 4️⃣ Run a test call

Use Vapi's **Web Call** widget (no phone number needed) and work through [`tests/test_cases.json`](tests/test_cases.json).

> 🔑 Test account `ACC-88392` (Rahul Sharma) accepts verification codes **`1234`** or **`1995`**.

| Endpoint | Purpose |
|---|---|
| `GET /health` | liveness check |
| `GET /log` | view all logged PTPs & dispositions from your test calls |

---

## 🧠 Design Choices

- **Low temperature (`0.1`)** — keeps the zero-disclosure-before-auth rule and disposition logging deterministic; this is a compliance flow, not a creative one.
- **Single webhook, dispatch by tool name** — one URL handles all 5 tools, routed inside `server.js`.
- **In-memory mock database** — sufficient for a demo; swapping in a real CRM later is a drop-in change.
- **PII masking at the logging layer** — names masked (`Rahul S****`), verification codes never logged in plaintext.
- **Compliance gate lives in the prompt, not just the tooling** — the LLM decides when to speak debt terms, so the rule has to be enforced there first.

## 🐞 Known Limitations / Bugs Encountered

- Mock "database" resets on every server restart — fine for a demo, not production.
- Vapi's tool-call payload sometimes sends `arguments` as a JSON string, sometimes as a parsed object — `server.js` handles both defensively.
- Mermaid CLI PNG export needs a local Chrome install; use [mermaid.live](https://mermaid.live) as a fallback.

## 🔮 Future Enhancements

See **Section 10** of the [HLD Document](docs/HLD_Document.md) — real-time compliance transcript scanning, more regional languages, risk-based step-up verification, and full CRM integration.

---

<div align="center">

Built for the **Kapture Finance** assignment · Powered by Vapi, Deepgram, GPT-4o & ElevenLabs

</div>
