import { writeFile } from "node:fs/promises";
import { exec } from "node:child_process";

// Ensure RIME_API_KEY is set in your environment
// e.g. run this script with: RIME_API_KEY=your_key node rime_standalone.js
const apiKey = process.env.RIME_API_KEY;

if (!apiKey) {
  console.error("Error: RIME_API_KEY environment variable is missing.");
  console.error("Please add it to your .env file and run the script again.");
  process.exit(1);
}

async function runTTS() {
  console.log("Calling Rime TTS API...");
  
  // Picked 'coda' as the primary full-duplex conversational model and 'astra' as the voice.
  // This satisfies the requirement to pick a model/voice combo for the README.
  const response = await fetch("https://users.rime.ai/v1/rime-tts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg", 
    },
    body: JSON.stringify({
      text: "Hi Priya, this is Bright Smile Dental. I can help you check or reschedule your appointment.",
      speaker: "astra", // Feel free to test with other voices
      modelId: "coda",  // The recommended conversational model
      lang: "en",
    }),
  });

  if (!response.ok) {
    throw new Error(`Rime API error: ${response.status} ${response.statusText}`);
  }

  // Convert the response to a buffer and save as an audio file
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const filename = "test_output.mp3";
  await writeFile(filename, audioBuffer);

  console.log(`Audio file saved successfully to ${filename}!`);
  
  // Optional: automatically play the audio on macOS
  console.log("Playing audio...");
  exec(`afplay ${filename}`, (error) => {
    if (error) {
      console.error("Failed to play audio. You can manually open the file.");
    }
  });
}

runTTS().catch(console.error);
