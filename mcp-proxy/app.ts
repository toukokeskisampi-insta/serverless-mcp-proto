import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PromptStore from './src/prompt-store.ts';
import MCPClient from './src/mcp-client.ts';

const SERVER_PORT = 3004;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mcpClient = new MCPClient();
const promptStorage = new PromptStore();
const app = express();
app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
mcpClient.connectToServer();

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  const similarPrompts = promptStorage.getSimilar(message);
  const prompt = promptStorage.add(message, similarPrompts);
  try {
    const response = await mcpClient.processQuery(prompt.message);
    res.json({
      response: response,
      similarPrompts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`Server listening at http://localhost:${SERVER_PORT}`);
});
