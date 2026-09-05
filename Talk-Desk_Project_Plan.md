# CallMate — Voice AI Support Agent
## DataForge 2026 — Rime Hackathon Track — Project Plan

---

## 1. The Idea (One Sentence)

**CallMate is an AI voice agent for a small business (e.g. a dental clinic) that handles phone-style calls — checking appointments, rescheduling, answering FAQs — and can be interrupted mid-sentence just like a real person, without breaking or getting confused.**

---

## 2. Why This Project (Context for the Team)

The Rime track requires:
- Voice must be **essential**, not decorative (no "chatbot with a play button")
- We must pick **one hard voice engineering problem**, define how we'll prove we solved it, and prove it under a stress test
- Rime must be the **primary spoken output**

**Our chosen hard problem: Interruption and Recovery ("barge-in").**
When the user starts talking while the AI is still speaking, the AI must:
1. Stop talking immediately (not finish its sentence)
2. Discard/cancel any response that's now outdated
3. Correctly understand and respond to what the user actually said

This is one of the hardest, most visible problems in voice AI — and one of the most common real-world failure points (Alexa/Siri-style assistants often fail at this).

**Our one-sentence falsifiable claim:**
> "When a user interrupts CallMate mid-response, audio playback stops within [X]ms, and the system correctly processes the new input instead of the old one."

We will measure and prove this exact claim in our demo.

---

## 3. The User Story (What We're Demoing)

> Priya calls to check her dental appointment.
>
> **AI:** "Hi, this is Bright Smile Dental's assistant. How can I help you today?"
> **Priya:** "I want to check my appointment."
> **AI:** "Sure, can I get your name?"
> **Priya:** "Priya Sharma."
> **AI:** "Let me check... your next appointment is Friday at 3 PM for a cleaning. Would you like to—"
> **Priya (interrupting):** "Actually, can you move it to next week?"
> **AI (stops instantly):** "Sure, what day next week works for you?"
> **Priya:** "Tuesday morning."
> **AI:** "You're rescheduled to Tuesday at 10 AM. Anything else?"
> **Priya:** "No, that's all, thanks."

This proves: real use case (people already call businesses by phone), voice is essential (nothing to click/type), and the hard problem (interruption) is demonstrated naturally.

---

## 4. System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐      ┌─────────┐      ┌───────────┐
│  User Mic   │ ───▶ │ LiveKit Agent │ ───▶ │ Speech-to-Text │ ───▶ │  Logic  │ ───▶ │   Rime    │
│ (browser)   │      │ (VAD + audio  │      │ (Deepgram /    │      │ (intent │      │  (TTS —   │
│             │      │  streaming)   │      │  AssemblyAI)   │      │ handler)│      │  speaks   │
└─────────────┘      └──────────────┘      └───────────────┘      └─────────┘      │  response)│
      ▲                      │                                                       └─────┬─────┘
      │                      │  detects user speaking again while                          │
      │                      │  AI is talking → triggers INTERRUPT                          │
      │                      ▼                                                              ▼
      │              ┌───────────────┐                                              ┌─────────────┐
      └───────────── │ Interrupt     │ ◀──── cancels in-flight response ────────────│   Speaker    │
                      │ Handler       │                                              │  (browser)   │
                      └───────────────┘                                              └─────────────┘
```

### Plain-language flow:
1. User's mic is always listening (Voice Activity Detection via LiveKit)
2. When user finishes a sentence, audio → sent to Speech-to-Text → returns text
3. Text → sent to our simple logic layer → decides intent (check appointment / reschedule / FAQ) → looks up mock data → produces a response
4. Response text → sent to Rime → Rime generates speech audio
5. Audio plays through the speaker
6. **At any point, if the user starts talking while step 5 is happening**, LiveKit's VAD detects this immediately, the Interrupt Handler stops playback, cancels any pending response from steps 3/4, and the loop restarts from step 2 with the new input

### Components & Ownership

| Component | Tool | Role |
|---|---|---|
| Real-time audio + interruption detection | **LiveKit Agents** | Handles mic streaming, Voice Activity Detection (VAD), and interruption events out of the box |
| Speech-to-Text | **Deepgram** or **AssemblyAI** | Converts user's spoken audio into text |
| Conversation logic | **Custom JS (if/else / simple intent matching)** | Decides what the AI should say based on user input + mock data |
| Mock data | **JSON file** | Fake patient/appointment records — no real database or email needed |
| Text-to-Speech | **Rime** (required) | Converts our response text into natural speech — this is the core required integration |
| Frontend | **Simple webpage (HTML/JS)** | Mic button, connection status, hosted on Vercel/Netlify |
| Latency logging | **Custom JS (timestamps)** | Measures time from "user stops talking" → "AI audio starts" — this becomes our evidence |

### Why no ML/AI expertise is needed
Every component above is a documented SDK/API call. We are not training models, not doing deep learning — we're wiring together existing, well-documented services. This is standard web/API integration work.

---

## 5. Cost

Everything below should be $0 using free tiers/trial credits:

| Service | Free tier |
|---|---|
| Rime | Check hackathon Discord/resources for provided credits/API key; also has its own free trial |
| LiveKit | Free open-source + generous LiveKit Cloud free tier |
| Deepgram | ~$200 free trial credit on signup |
| Hosting (Vercel/Netlify) | Free tier, plenty for a demo |

---

## 6. Team Roles (4 People)

| Person | Role | Days 1–2 Focus | Days 3–4 Focus |
|---|---|---|---|
| **P1 — Voice Pipeline Lead** | LiveKit + STT | Set up LiveKit Agents project, wire in Deepgram/AssemblyAI, get raw transcripts working | Help build/test interruption handling |
| **P2 — Rime/Output Lead** | Rime integration | Get Rime speaking text aloud through LiveKit | Build latency measurement/logging |
| **P3 — Logic/Brain Lead** | Conversation logic | Build intent handling (check/reschedule/FAQ) + mock JSON data | Refine responses, handle edge cases |
| **P4 — Frontend + Docs Lead** | UI + submission | Build simple webpage (mic button, status indicator), connect to LiveKit room | Write README, RIME_EVIDENCE.md, edit demo video |

**Day 3 is a group effort** — everyone works together on the interruption/barge-in feature since it's the highest-value, highest-risk part of the project.

---

## 7. Step-by-Step Build Plan

### **Day 1 — Foundation (build pieces separately)**

**Morning (all together, ~45 min):**
- Read through: LiveKit Agents quickstart docs, Rime's LiveKit integration guide, Deepgram/AssemblyAI quickstart
- Set up a shared GitHub repo
- Create `.env.example` file (placeholders only — real keys go in each person's local `.env`, never committed)

**Then split up:**
- **P1:** Scaffold a LiveKit Agents project. Get a basic pipeline working where the mic captures audio and prints a transcript to the console (via Deepgram/AssemblyAI).
- **P2:** Write a standalone script (no LiveKit yet) where typed text is sent to Rime's API and speaks it out loud. Just prove Rime works in isolation first.
- **P3:** Write the mock data file (`patients.json` — fake names + appointment times). Write simple logic: given input like `"check appointment"`, look up the record and return a response string. No AI/LLM needed — plain if/else or keyword matching is fine and more reliable to demo.
- **P4:** Build a minimal webpage: a "Start Call" button, mic permission request, and a status area (e.g. "Listening…" / "Speaking…"). Connect it to a LiveKit room (join logic only, no audio processing yet).

**End of Day 1 goal:** All four pieces work *individually* — not yet connected to each other.

---

### **Day 2 — Wire everything together (full round trip)**

- Merge all four pieces into one flow: **mic → LiveKit → STT → logic (P3's code) → Rime (P2's code) → speaker**
- Test the basic conversation: user says "check my appointment" → correct mock data is looked up → Rime speaks the correct answer back
- P4 continues polishing the webpage UI in parallel (status indicators, clean layout)

**End of Day 2 goal:** A full working (even if rough) back-and-forth voice conversation — no interruption handling yet.

---

### **Day 3 — The hard part: Interruption Handling (Barge-In)**

Whole team works together here — this is 25% of the score ("hard voice engineering").

- Implement: when LiveKit's VAD detects the user speaking while Rime's audio is still playing, immediately:
  1. Stop/cancel the current audio playback
  2. Cancel or discard any in-flight STT/logic/Rime calls tied to the old turn
  3. Start processing the new user input fresh
- P2 adds latency logging: timestamp when user stops speaking, timestamp when new AI audio starts playing — log the difference (this is our "evidence")
- **Test relentlessly**, in different scenarios:
  - Interrupt right at the start of an AI sentence
  - Interrupt right at the end
  - Interrupt with a completely unrelated new request
  - Rapid back-to-back interruptions

**End of Day 3 goal:** Interruption reliably works, and latency numbers are being logged for every turn.

---

### **Day 4 — Proof, Demo, and Submission**

**Morning:** Final bug fixes and stability pass — don't add new features today.

**Record the demo video (max 4–5 minutes):**
1. Introduce the user/problem (10-15 sec)
2. Show a normal successful call flow (check appointment)
3. Show the deliberate interruption stress test (this is the core proof)
4. Show the latency numbers on screen as evidence
5. Explicitly say on camera: *"Rime is generating all spoken responses you're hearing"*

**Write submission materials (P4 leads, team reviews):**
- **README.md** — setup instructions, architecture diagram (copy from Section 4 above), exact Rime model/voice/language/endpoint used, known limitations, what's real vs. mock data
- **RIME_EVIDENCE.md** — our one-sentence claim, our acceptance test method, how we ran it, our measured result, and any limitations
- `.env.example` — confirm only placeholders, no real secrets anywhere in the repo (check commit history too)

**Final team rehearsal:** Every team member should be able to explain any part of the system if judges ask — this matters for the "technical ownership and live defense" score (15%).

---

## 8. What We Are Explicitly NOT Building (Scope Control)

To stay realistic in 4 days, we are deliberately **not** doing:
- Real email/Gmail/messaging integration (using mock JSON data instead — this will be clearly disclosed in the README)
- A real phone number / Twilio integration (browser-based demo only, unless we have spare time on Day 4)
- Speaker/voice recognition (we don't need to know *who* is talking, just *that* someone is talking)
- An LLM-based "smart" conversation brain (simple rule-based logic is more reliable and easier to defend live)
- Background/lock-screen operation on mobile (app runs while the browser tab is open and active, like a phone call — this will be stated clearly, not hidden)

These are honest, reasonable scope cuts for a 4-day hackathon and will be disclosed transparently in our README, which the judging rubric explicitly rewards ("no AI slop," accurate disclosure of what's real vs. simulated).

---

## 9. Judging Rubric Recap (What We're Optimizing For)

| Criteria | Weight | Our approach |
|---|---|---|
| Problem & necessity of voice | 25% | Business phone-call use case — voice is the only natural interface |
| Hard voice engineering | 25% | Interruption/barge-in handling, proven with a stress test |
| Rime integration & experience | 20% | Rime as the sole, central spoken output, correctly configured |
| Evidence & reproducibility | 20% | RIME_EVIDENCE.md + latency logs + repeatable test |
| Demo clarity | 10% | Clear 4-5 min video following the structure above |

---

*Document prepared for team distribution — DataForge 2026, Pathway x Rime Hackathon.*
