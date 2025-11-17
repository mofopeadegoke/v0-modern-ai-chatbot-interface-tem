"use server"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, jsonSchema, tool, ToolSet } from "ai"

const mcp = new Client(
  { name: "bmo-client", version: "0.1.0" },
  { capabilities: { sampling: {} } }
)

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/server.js"],
  stderr: "inherit",
})

let ready: Promise<void> | null = null
function ensureMcpReady() {
  if (!ready) {
    ready = (async () => {
      console.log("🔌 Connecting MCP…")
      await mcp.connect(transport)
      console.log("✅ MCP connected")
    })()
  }
  return ready
}

async function getTools() {
  const { tools } = await mcp.listTools()
  console.log("📦 Loaded tools:", tools.map((t) => t.name))
  return tools
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.API_KEY,
})

export async function handleQuery(query: string) {
  await ensureMcpReady()

  const tools = await getTools()

  const { text, toolResults } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: query,
    tools: tools.reduce((obj, t) => {
      obj[t.name] = tool({
        description: t.description,
        inputSchema: jsonSchema(t.inputSchema),
        execute: async (args) => {
          console.log("🧰 Tool called:", t.name, args)
          return await mcp.callTool({
            name: t.name,
            arguments: args,
          })
        },
      })
      return obj
    }, {} as ToolSet),
  })

  console.log("🧪 toolResults:", toolResults)

  return (
    text ||
    toolResults?.[0]?.output?.content?.[0]?.text ||
    "No text generated."
  )
}
