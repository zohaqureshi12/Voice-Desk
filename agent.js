import 'dotenv/config';
import { cli, defineAgent, WorkerOptions, voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as silero from '@livekit/agents-plugin-silero';

export default defineAgent({
    entry: async (ctx) => {
        await ctx.connect();
        console.log('✅ Connected to LiveKit room:', ctx.room.name);

        const vad = await silero.VAD.load();

        const session = new voice.AgentSession({
            vad,
            stt: new deepgram.STT({
                apiKey: process.env.DEEPGRAM_API_KEY,
            }),
        });

        // Log every time the user starts/stops speaking (VAD events)
        session.on('user_started_speaking', () => {
            console.log('🎙️ User started speaking');
        });

        session.on('user_stopped_speaking', () => {
            console.log('🛑 User stopped speaking');
        });

        // Log final transcripts as they come in from Deepgram
        session.on('user_transcript', (text) => {
            console.log('📝 Transcript:', text);
        });

        await session.start({ room: ctx.room });
    },
});

cli.runApp(new WorkerOptions({ agent: import.meta.url }));