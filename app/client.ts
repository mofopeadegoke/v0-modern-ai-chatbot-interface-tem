import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { deepseek } from '@ai-sdk/deepseek';
import {generateText, jsonSchema, tool, ToolSet} from 'ai'


const mcp = new Client({
    name: 'bmo-client',
    version: '0.1.0',
}, 
{capabilities: {sampling: {}}}
)

const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js'],
    stderr: 'ignore'
})



async function getTools() {
    const {tools} = await mcp.listTools()
    return tools
}

async function main() {
    await mcp.connect(transport)
    const [tools, prompts, resources, resourceTemplates] = await Promise.all([
        getTools(),
        mcp.listPrompts(),
        mcp.listResources(),
        mcp.listResourceTemplates()
    ])
}

export async function handleQuery(query: string) {
    const tools = await getTools();
  const { text, toolResults } = await generateText({
    model: deepseek("deepseek-chat"),
    prompt: query,
    tools: tools.reduce(
      (obj, t) => ({
        ...obj,
        [t.name]: tool({
          description: t.description,
          inputSchema: jsonSchema(t.inputSchema),
          execute: async (args: Record<string, any>) => {
            return await mcp.callTool({
              name: t.name,
              arguments: args,
            })
          },
        }),
      }),
      {} as ToolSet
    ),
  })

  // @ts-expect-error
  return text || toolResults?.[0]?.result?.content?.[0]?.text || "No text generated.";
}


main()