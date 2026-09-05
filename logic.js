/**
 * Pair A (LiveKit/STT) will call this function every time the user finishes speaking.
 * 
 * @param {string} transcript - The final text transcribed by Deepgram/AssemblyAI.
 * @param {number} turnId - The current turn ID (incremented by Pair A upon detecting speech).
 */
export async function processTranscript(transcript, turnId) {
    console.log(`[Turn ${turnId}] Received transcript from Pair A: "${transcript}"`);

    // TODO (Pair B / P3): 
    // 1. Determine intent (check appointment, reschedule, etc.)
    // 2. Look up mock data from patients.json
    // 3. Generate response text
    // 4. Call Rime TTS to generate audio
    // 5. Send audio to LiveKit room
}