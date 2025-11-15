import ollama from 'ollama';
import type { ChatResponse, Tool, Message, ToolCall } from 'ollama';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";
import {
    ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

dotenv.config();

// granite4:3b
// granite4:1b
// llama3.2:3b
// gpt-oss:latest
// granite4:350m

const TOOL_MODEL = "granite4:3b";
const ANALYZE_MODEL = "gpt-oss:latest";
const USER_TIMEZONE = "EET";

const getSystemPrompt = () => {
    const now = new Date();
    const utcDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const utcTime = now.toISOString().split('T')[1].replace(/\.\d+Z$/, 'Z'); // HH:MM:SSZ
    return `
Your function is to read electricity data from DynamoDB using available tools and give a short answer based on returned in the ${USER_TIMEZONE} timezone and in the same language as the request.

Today is ${utcDate} and the time is ${utcTime}

ElectricityTable contains the price of electricity for each 15 minutes of each hour of the day. Use query-table to find prices for specific times.

ElectricityTable columns
* start_date, String, partition key, "YYYY-MM-DD" format
* start_time, String, sort key, "HH:mm:ssZ" format, UTC timezone
* price, String, Price of electricity as "euro cents/kWh"

Query example
{
    "ExpressionAttributeValues": {
        ":date":"2025-11-12",
        ":start":"18:00:00Z",
        ":end":"22:00:00Z"
    },
    "KeyConditionExpression": "start_date = :date AND start_time BETWEEN :start AND :end",
    "limit":100,
    "TableName":"ElectricityTable"
}
`;
}

const getToolCalls = (message: Message): ToolCall[] => message.tool_calls ? message.tool_calls : [];
const parseErrorMessage = (error: unknown): string => error !== null && typeof error === "object" && "message" in error ? error.message as string : "Could not parse error message";
const parseToolResult = (result: unknown) => {
    if (result !== null && typeof result === "object" && "content" in result) {
        const firstElement = Array.isArray(result.content) ? result.content[0] as { type: string; text: string; } : null;
        return firstElement?.text;
    }
};

class MCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private availableTools: Tool[] = [];

    constructor() {
    }

    async connectToServer(): Promise<void> {
        this.transport = new StdioClientTransport({
            command: 'node',
            args: ['/home/touko/Projects/serverless-mcp-proto/server/dynamo-readonly-mcp/dist/index.js'],
            env: {
                AWS_ACCESS_KEY_ID: 'localDbCredentialId',
                AWS_SECRET_ACCESS_KEY: 'localDbCredentialKey',
                AWS_REGION: 'eu-north-1',
                DYNAMO_DB_URL: 'http://localhost:8000',
            }
        });
        this.client = new Client({
            name: 'dynamodb-mcp-client',
            version: '1.0.0'
        });
        await this.client.connect(this.transport);
        console.log('Connected using Stdio transport');

        const response = await this.client.request(
            { method: "tools/list" },
            ListToolsResultSchema
        );

        console.log(
            "\nConnected to server with tools:",
            response.tools.map((tool: { name: string }) => tool.name)
        );
    }

    async loadAvailableTools() {
        if (!this.client) {
            throw new Error("Client not connected");
        }

        const toolsResponse = await this.client.request(
            { method: "tools/list" },
            ListToolsResultSchema
        );
        this.availableTools = toolsResponse.tools.map((tool) => ({
            type: 'MCP',
            function: {
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            }
        }));
    }

    async performToolCall(messages: Message[], toolCall: ToolCall): Promise<Message[]> {
        if (!this.client) {
            throw new Error("Client not connected");
        }

        const toolName = toolCall.function.name;
        try {
            const toolCallResult = await this.client.callTool(toolCall.function);
            const toolCallText = parseToolResult(toolCallResult);
            messages.push({
                role: "tool",
                content: JSON.stringify(toolCallText),
                tool_name: toolName,
            });
        } catch (error) {
            const errorMessage = parseErrorMessage(error);
            messages.push({
                role: "tool",
                content: errorMessage,
                tool_name: toolName,
            });
        }

        const analyzeResponse = await ollama.chat({
            model: ANALYZE_MODEL,
            messages,
        });
        messages.push(analyzeResponse.message);

        return messages;
    }

    async processQuery(query: string): Promise<Message[]> {
        if (!this.client) {
            throw new Error("Client not connected");
        }

        await this.loadAvailableTools();

        const messages: Message[] = [
            {
                role: "system",
                content: getSystemPrompt()
            },
            {
                role: "user",
                content: query,
            },
        ];

        const initialResponse: ChatResponse = await ollama.chat({
            model: TOOL_MODEL,
            messages,
            tools: this.availableTools,
        });
        messages.push(initialResponse.message);

        for (let i = 0; i < messages.length; i++) {
            const currentMessage = messages[i];
            if (currentMessage) {
                const toolCalls = getToolCalls(currentMessage);
                if (toolCalls.length > 0) {
                    for (const toolCall of toolCalls) {
                        await this.performToolCall(messages, toolCall);
                    }
                }
            }
        }

        return messages;
    }
}

export default MCPClient;