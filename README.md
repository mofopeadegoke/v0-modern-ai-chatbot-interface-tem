# A A Modern AI Chatbot Interface

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mofopeadegokes-projects/v0-modern-ai-chatbot-interface-tem)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/eFWcLFwDSaN)

## Overview

A modern, full-featured AI chatbot interface built with Next.js 15 and the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). The app provides a polished chat UI with conversation management, folder organisation, reusable prompt templates, and a built-in MCP server for AI tool use.

This repository stays in sync with your deployed chats on [v0.app](https://v0.app). Any changes you make to your deployed app are automatically pushed here and then deployed to Vercel.

---

## Features

- **Multi-conversation chat** – start unlimited chats, switch between them instantly, and keep a searchable history.
- **Pinned & recent conversations** – pin important threads to the top for quick access; the last 10 active chats surface automatically in the Recent section.
- **Folder organisation** – group conversations into custom folders (Work Projects, Personal, Code Reviews, etc.).
- **Prompt templates** – save and reuse common prompts (Bug Report, Daily Standup, Code Review, Meeting Notes, and any custom template you create).
- **AI integration via MCP** – user messages are routed to a Next.js API route (`/api/mcp`) that calls an MCP client. The bundled MCP server exposes tools and resources for interacting with an external data source.
- **Thinking indicator** – an animated "thinking" state is shown while the AI is generating a response; it can be paused at any time.
- **Edit & resend messages** – edit any previously sent message and resend it without starting a new chat.
- **Collapsible sidebar** – the sidebar can be fully collapsed to an icon-only rail on desktop; on mobile it slides in as a drawer.
- **Dark / light theme** – system preference is detected automatically; manual override is persisted in `localStorage`.
- **Keyboard shortcuts** – see the [Keyboard Shortcuts](#keyboard-shortcuts) section below.
- **Responsive layout** – adapts gracefully from mobile to wide-screen desktop.
- **Vercel Analytics** – first-party analytics included out of the box.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript + React 19 |
| Styling | [Tailwind CSS v3](https://tailwindcss.com/) + [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) |
| UI components | [Radix UI](https://www.radix-ui.com/) primitives + [shadcn/ui](https://ui.shadcn.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| AI SDK | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` package), `@ai-sdk/google`, `@ai-sdk/deepseek` |
| MCP | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| Icons | [Lucide React](https://lucide.dev/) |
| Fonts | [Geist](https://vercel.com/font) (sans + mono) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |
| Package manager | [pnpm](https://pnpm.io/) |

---

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts        # POST /api/mcp – receives user query, calls MCP client
│   ├── client.ts               # MCP client helper (handleQuery)
│   ├── server.ts               # Standalone MCP server (stdio transport)
│   ├── globals.css             # Global styles & CSS variables
│   ├── layout.tsx              # Root layout (fonts, metadata, analytics)
│   └── page.tsx                # Entry point – renders <AIAssistantUI />
│
├── components/
│   ├── AIAssistantUI.jsx       # Root component – state management & layout
│   ├── Sidebar.jsx             # Collapsible sidebar with search, folders, templates
│   ├── ChatPane.jsx            # Active conversation view + message list
│   ├── Composer.jsx            # Message input with template insertion
│   ├── ComposerActionsPopover.jsx
│   ├── Header.jsx              # Top bar (new chat, sidebar toggle)
│   ├── Message.jsx             # Individual message bubble (edit / resend)
│   ├── ConversationRow.jsx     # Sidebar conversation list item
│   ├── FolderRow.jsx           # Sidebar folder list item (expand/collapse)
│   ├── TemplateRow.jsx         # Sidebar template list item
│   ├── SidebarSection.jsx      # Collapsible sidebar section wrapper
│   ├── SearchModal.jsx         # Full-screen search overlay
│   ├── CreateFolderModal.jsx   # Modal for creating a new folder
│   ├── CreateTemplateModal.jsx # Modal for creating/editing a template
│   ├── SettingsPopover.jsx     # Settings popover menu
│   ├── ThemeToggle.jsx         # Dark/light theme toggle button
│   ├── GhostIconButton.jsx     # Utility icon button component
│   ├── mockData.js             # Seed data (conversations, templates, folders)
│   ├── theme-provider.tsx      # next-themes provider
│   ├── utils.js                # Utility helpers (cls, makeId, …)
│   └── ui/                     # Auto-generated shadcn/ui components
│
├── public/                     # Static assets
├── styles/                     # Additional stylesheets
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.server.json        # Separate TS config for the MCP server build
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **pnpm** 8 or later (`npm install -g pnpm`)

### Installation

```bash
git clone https://github.com/mofopeadegoke/v0-modern-ai-chatbot-interface-tem.git
cd v0-modern-ai-chatbot-interface-tem
pnpm install
```

### Running locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The app will work without a running MCP server – it falls back gracefully if `/api/mcp` returns an error. To enable live AI responses, set up the MCP server (see below).

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Build the Next.js app for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm server:dev` | Run the MCP server locally via `ts-node` |
| `pnpm server:build` | Compile the MCP server to JavaScript (`dist/server.js`) |
| `pnpm server:run` | Run the compiled MCP server |
| `pnpm server:inspect` | Open the MCP Inspector UI connected to the dev server |

---

## MCP Server

The project ships with a standalone [Model Context Protocol](https://modelcontextprotocol.io/) server (`app/server.ts`) that the Next.js API route communicates with. It exposes the following capabilities:

### Tools

| Tool | Description |
|---|---|
| `add-constants` | Add a new constant entry (English + Turkish) to the BMO database |
| `get-constants` | Retrieve all constants from the BMO database |
| `search-constants` | Search constants by query string across title, title\_\_en, and type fields |

### Resources

| Resource URI | Description |
|---|---|
| `constants://all` | Fetch all constants as JSON |
| `constants://by-query/{query}` | Fetch constants matching a search query |

### Prompts

| Prompt | Description |
|---|---|
| `Generate values for constants` | Generate bilingual (TR/EN) values for a given constant type |

### Running the MCP Server

```bash
# Development (uses ts-node, no build step required)
pnpm server:dev

# Production (compile first, then run)
pnpm server:build
pnpm server:run

# Inspect tools/resources interactively
pnpm server:inspect
```

The MCP server communicates over **stdio**. The Next.js app calls it through the `handleQuery` helper in `app/client.ts`, which is invoked by the `POST /api/mcp` API route.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ N` / `Ctrl N` | Start a new chat |
| `/` | Focus the search bar (when not in an input) |
| `Escape` | Close the mobile sidebar drawer |

---

## Deployment

The app is deployed on Vercel and automatically rebuilds whenever changes are pushed to this repository.

**Live URL:** [https://vercel.com/mofopeadegokes-projects/v0-modern-ai-chatbot-interface-tem](https://vercel.com/mofopeadegokes-projects/v0-modern-ai-chatbot-interface-tem)

To deploy your own instance:

1. Fork this repository.
2. Import it into [Vercel](https://vercel.com/new).
3. Vercel will detect Next.js automatically – no extra configuration is needed for the frontend.

---

## How the v0 Sync Works

1. Create and iterate on your project using [v0.app](https://v0.app/chat/projects/eFWcLFwDSaN).
2. Deploy your changes from the v0 interface.
3. Changes are automatically pushed to this repository.
4. Vercel picks up the push and deploys the latest version.
