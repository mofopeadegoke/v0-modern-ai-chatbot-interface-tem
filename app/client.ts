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

  // Enhanced prompt that encourages the model to answer directly when possible
  const masterPrompt = `
${query}

Guidelines:
- Answer the question directly using your own knowledge whenever possible.
- Only use the available tools if the query specifically requires external data, actions, or capabilities you don't have.
- When you do use tools, interpret their JSON results and convert them into clean, human-readable paragraphs.
- Never return raw JSON unless explicitly asked.
- If a tool returns data, provide a concise summary with key points and any recommended next steps.
  `.trim()

  const { text, toolResults } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: masterPrompt,
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
  console.log("📝 text from model:", text)

  // If the model returned text (whether it used tools or not), return it
  if (text && String(text).trim()) {
    return text
  }

  // Fallback: Handle case where model used tools but didn't format the output
  const firstToolOutput =
    toolResults?.[0]?.output?.content?.[0]?.text ||
    toolResults?.[0]?.output ||
    null

  if (firstToolOutput) {
    const formatPrompt = `
I received the following tool output. Please convert it into a short, clear, human-readable explanation in paragraph form. Do NOT return raw JSON. Explain the key information concisely.

Tool output:
${typeof firstToolOutput === "string" ? firstToolOutput : JSON.stringify(firstToolOutput, null, 2)}
    `.trim()

    try {
      const formatted = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: formatPrompt,
      })
      
      return formatted.text || formatted
    } catch (e) {
      console.error("Formatting fallback failed:", e)
      return typeof firstToolOutput === "string" 
        ? firstToolOutput 
        : JSON.stringify(firstToolOutput, null, 2)
    }
  }

  // Final fallback
  return "No response generated."
}