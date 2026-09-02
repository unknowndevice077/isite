import { google } from '@ai-sdk/google';

// Single place to change the model — GOOGLE_GENERATIVE_AI_API_KEY is read
// automatically by @ai-sdk/google from the environment.
export const questScribeModel = google('gemini-3.6-flash');
