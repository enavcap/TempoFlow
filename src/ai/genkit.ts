import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// Optional: anthropic plugin to enable Claude Sonnet 4
// Will fall back to Google Gemini if not installed
let anthropicPlugin: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  anthropicPlugin = require('@genkit-ai/anthropic').anthropic;
} catch (e) {
  // anthropic plugin not installed - keep googleAI
  anthropicPlugin = null;
}

const plugins = [googleAI()];
if (anthropicPlugin) plugins.unshift(anthropicPlugin());

// Prefer Claude Sonnet 4 when anthropic plugin is available
const defaultModel = anthropicPlugin ? 'anthropic/claude-sonnet-4' : 'googleai/gemini-2.0-flash';

export const ai = genkit({
  plugins,
  model: defaultModel,
});
