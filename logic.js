import fs from 'node:fs/promises';

// This is the activeResponseController stub from earlier, moved here for use
export const activeResponseController = {
  abortController: new AbortController(),
  cancel: function() {
    console.log(`[Interrupt] activeResponseController.cancel() called!`);
    this.abortController.abort();
    this.abortController = new AbortController();
  },
  getSignal: function() {
    return this.abortController.signal;
  }
};

/**
 * Pair A (LiveKit/STT) will call this function every time the user finishes speaking.
 * 
 * @param {string} transcript - The final text transcribed by Deepgram/AssemblyAI.
 * @param {number} turnId - The current turn ID (incremented by Pair A upon detecting speech).
 * @param {object} session - The LiveKit AgentSession (needed to play audio back).
 */
export async function processTranscript(transcript, turnId, session) {
    console.log(`[Turn ${turnId}] Received transcript from Pair A: "${transcript}"`);
    const lowerText = transcript.toLowerCase();
    let responseText = "I'm sorry, I didn't quite catch that. Can you repeat?";

    try {
        // 1. Determine intent & 2. Look up mock data
        const dataRaw = await fs.readFile('patients.json', 'utf8');
        const db = JSON.parse(dataRaw);

        if (lowerText.includes("appointment") || lowerText.includes("when is my")) {
            // Hardcoding to Priya for the demo flow as defined in the plan
            const patient = db.patients.find(p => p.name === "Priya Sharma");
            if (patient) {
                responseText = `Let me check... your next appointment is ${patient.day} at ${patient.time} for a ${patient.type}. Would you like to keep it or reschedule?`;
            }
        } else if (lowerText.includes("reschedule") || lowerText.includes("next week") || lowerText.includes("move it") || lowerText.includes("tuesday")) {
            responseText = "Sure, I can reschedule that for you. What day next week works best?";
            if (lowerText.includes("tuesday")) {
                 responseText = "You're rescheduled to Tuesday at 10 AM. Anything else?";
            }
        } else if (lowerText.includes("no") || lowerText.includes("thanks") || lowerText.includes("that's all")) {
            responseText = "Great, thanks for calling Bright Smile Dental. Have a wonderful day!";
        } else if (lowerText.includes("hours") || lowerText.includes("open")) {
            responseText = db.faqs.hours;
        }

        console.log(`[Turn ${turnId}] Decided on response: "${responseText}"`);

        // Check if interrupted before Rime call
        if (activeResponseController.getSignal().aborted) {
             console.log(`[Turn ${turnId}] Discarded before Rime TTS (interrupted).`);
             return;
        }

        // 3. Call Rime TTS (Pair B)
        // (This will be integrated directly via fetch like in rime_standalone.js or via LiveKit TTS)
        console.log(`[Turn ${turnId}] Sending to Rime...`);
        
        // TODO: Pass audio back to LiveKit room

    } catch (err) {
        console.error(`[Turn ${turnId}] Error:`, err);
    }
}