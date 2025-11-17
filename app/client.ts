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

// client.ts (only changed parts shown — drop into your existing file)
export async function handleQuery(query: string) {
  await ensureMcpReady()

  const tools = await getTools()

  // === Master prompt wrapper (Fix 3) ===
  const masterPrompt = `
${query}

When using tools:
- Interpret JSON results returned by tools.
- Convert any structured JSON results into a clean, human-readable paragraph (or a few short paragraphs).
- Never return raw JSON unless explicitly asked to do so.
- If you call a tool and it returns data, produce a short summary explaining the key points and any recommended next steps.
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

  // If the model already returned nice text, use it.
  if (text && String(text).trim()) {
    return text
  }

  // Fallback: maybe the model left output in toolResults (raw JSON). Convert that into a readable string.
  // We'll call the model again with the tool result JSON and ask it to format it nicely.
  // This is a short helper fallback — keep it only for debugging/robustness.
  const firstToolOutput =
    toolResults?.[0]?.output?.content?.[0]?.text ||
    toolResults?.[0]?.output ||
    null

  if (firstToolOutput) {
    const formatPrompt = `
I was given the following tool output (likely JSON or structured data). Please convert it into a short, clear, human-readable explanation in paragraph form. Do NOT return raw JSON. If some fields look like identifiers, explain them briefly.

Tool output:
${typeof firstToolOutput === "string" ? firstToolOutput : JSON.stringify(firstToolOutput, null, 2)}
    `.trim()

    try {
      const formatted = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: formatPrompt,
      })
      // formatted.text might hold the nicely formatted output
      
      return formatted.text || formatted
    } catch (e) {
      console.error("Formatting fallback failed:", e)
      // last resort: return the raw tool output as a string
      return typeof firstToolOutput === "string" ? firstToolOutput : JSON.stringify(firstToolOutput)
    }
  }

  // final fallback
  return "No text generated."
}

