import { bedrock } from '@ai-sdk/amazon-bedrock';
import { CoreMessage, generateText } from 'ai';
import dotenv from 'dotenv';
import * as readline from 'node:readline/promises';
import { weatherTool } from '../tools/weather-tool';

dotenv.config();

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: CoreMessage[] = [];

async function main() {
  let toolResponseAvailable = false;

  while (true) {
    if (!toolResponseAvailable) {
      const userInput = await terminal.question('You: ');
      messages.push({ role: 'user', content: userInput });
    }

    const { text, toolCalls, toolResults, responseMessages } =
      await generateText({
        model: bedrock('anthropic.claude-3-haiku-20240307-v1:0'),
        tools: { weatherTool },
        system: `You are a helpful, respectful and honest assistant. If the weather is requested use the `,
        messages,
      });

    toolResponseAvailable = false;

    if (text) {
      process.stdout.write(`\nAssistant: ${text}`);
    }

    for (const { toolName, args } of toolCalls) {
      process.stdout.write(
        `\nTool call: '${toolName}' ${JSON.stringify(args)}`,
      );
    }

    for (const { toolName, result } of toolResults) {
      process.stdout.write(
        `\nTool response: '${toolName}' ${JSON.stringify(result)}`,
      );
    }

    process.stdout.write('\n\n');

    messages.push(...responseMessages);

    toolResponseAvailable = toolCalls.length > 0;
  }
}

main().catch(console.error);
