"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
// MCP server configuration
const server = new mcp_js_1.McpServer({
    name: "Test MCP Server",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
function csvToJson(csvText) {
    // Split the text into lines
    const lines = csvText.trim().split("\n");
    // Extract the headers (first row)
    const headers = lines[0].split(",").map(h => h.trim());
    // Convert each remaining line into an object
    const result = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const entry = {};
        headers.forEach((header, i) => {
            entry[header] = values[i] || "";
        });
        return entry;
    });
    return result;
}
// Add a new constant tool
server.tool("add-constants", "Add constants in both english and turkish languages", {
    title: zod_1.z.string().min(1).max(100).describe("Title of the constant to add"),
    title__en: zod_1.z.string().min(1).max(100).describe("Başlık"),
    type: zod_1.z.enum(["bolum", "dil", "mevki", "saha", "ilce", "muhesebesebep", "ulke", "egitim"]).describe("Type of the constant"),
}, {
    title: "Add Constant",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
}, async (args, extra) => {
    try {
        const loginId = "qwer1234";
        const response = await axios_1.default.post("http://bmo.localhost/constant/actions/add.php", {
            title: args.title,
            title__en: args.title__en,
            type: args.type
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cookie": `bmo_LOGINID=${loginId}`,
            }
        });
        // Check response status
        if (response.status === 200) {
            let message = "Constant added successfully.";
            for (const key in response.headers) {
                if (key.toLowerCase().includes("x-op")) {
                    message += ` ${key}: ${response.headers[key]}`;
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: message,
                    }
                ]
            };
        }
        else {
            let message = "Failed to add constant.";
            for (const key in response.headers) {
                if (key.toLowerCase().includes("x-op")) {
                    message += ` ${key}: ${response.headers[key]}`;
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: message,
                    }
                ]
            };
        }
    }
    catch (error) {
        let message = "Failed to add constant.";
        for (const key in error.response.headers) {
            if (key.toLowerCase().includes("x-op")) {
                message += ` ${key}: ${error.response.headers[key]}`;
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: message,
                }
            ]
        };
    }
});
server.tool("get-constants", "Get constants in bmo database", {}, {
    title: "Get Constant",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
}, async () => {
    try {
        const loginId = "qwer1234";
        const response = await axios_1.default.get("http://bmo.localhost/constant/data/csv.php", {
            headers: {
                "Content-Type": "text/csv",
                "Cookie": `bmo_LOGINID=${loginId}`,
                "Accept": "text/csv",
            }
        });
        if (response.status === 200) {
            return {
                content: [
                    {
                        type: "text",
                        mimeType: "application/json",
                        text: JSON.stringify(csvToJson(String(response.data))),
                    }
                ]
            };
        }
        else {
            let message = "Failed to add constant.";
            for (const key in response.headers) {
                if (key.toLowerCase().includes("x-op")) {
                    message += ` ${key}: ${response.headers[key]}`;
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: message,
                    }
                ]
            };
        }
    }
    catch (error) {
        let message = "Failed to add constant.";
        for (const key in error.response.headers) {
            if (key.toLowerCase().includes("x-op")) {
                message += ` ${key}: ${error.response.headers[key]}`;
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: message,
                }
            ]
        };
    }
});
// Search tool for searching constants in bmo database by query
server.tool("search-constants", "Search constants in bmo database by query. the system can perform a search for title, title__en and type fields. The search string can appear anywhere in these fields. Type could be in English or Turkish. It is possible to restrict search to the start by placing a double quote at the start of the string, restrict to the end by placing a quote at the end or exact match by placing quotes around the entire string. Multiple search strings can be specified using a comma in between. Each string must match for a record to be displayed. type can optionally be filtered using filter_type. Filter must use the key for the type, which could be one of the following: 'bolum','ulke','mevki','saha','ilce','muhesebesebep','egitim','dil'", {
    query: zod_1.z.string().min(1).max(100).describe("Search query"),
}, {
    title: "Search Constant",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
    description: "Search constants in bmo database by query. the system can perform a search for title, title__en and type fields. The search string can appear anywhere in these fields. Type could be in English or Turkish. It is possible to restrict search to the start by placing a double quote at the start of the string, restrict to the end by placing a quote at the end or exact match by placing quotes around the entire string. Multiple search strings can be specified using a comma in between. Each string must match for a record to be displayed. type can optionally be filtered using filter_type. Filter must use the key for the type, which could be one of the following: 'bolum','ulke','mevki','saha','ilce','muhesebesebep','egitim','dil'"
}, async (args) => {
    try {
        const loginId = "qwer1234";
        const response = await axios_1.default.get(`http://bmo.localhost/constant/data/csv.php?fieldset=list&=&length=36&search=${args.query}`, {
            headers: {
                "Content-Type": "text/csv",
                "Cookie": `bmo_LOGINID=${loginId}`,
            }
        });
        if (response.status === 200) {
            return {
                content: [
                    {
                        type: "text",
                        mimeType: "application/json",
                        text: JSON.stringify(csvToJson(String(response.data))),
                    }
                ]
            };
        }
        else {
            let message = "Failed to add constant.";
            for (const key in response.headers) {
                if (key.toLowerCase().includes("x-op")) {
                    message += ` ${key}: ${response.headers[key]}`;
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: message,
                    }
                ]
            };
        }
    }
    catch (error) {
        let message = "Failed to add constant.";
        for (const key in error.response.headers) {
            if (key.toLowerCase().includes("x-op")) {
                message += ` ${key}: ${error.response.headers[key]}`;
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: message,
                }
            ]
        };
    }
});
// Resources
// Resource to get all constants from BMO system database
server.resource("constants", "constants://all", {
    description: "Get all constants from the BMO system database",
    title: "BMO Constants",
    mimeType: "application/json",
}, async (uri) => {
    try {
        const loginId = "qwer1234";
        const response = await axios_1.default.get("http://bmo.localhost/constant/data/csv.php", {
            headers: {
                "Content-Type": "text/csv",
                "Cookie": `bmo_LOGINID=${loginId}`,
                "Accept": "text/csv",
            }
        });
        if (response.status === 200) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "application/json",
                        text: JSON.stringify(csvToJson(String(response.data))),
                    }
                ]
            };
        }
        else {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "text/plain",
                        text: "Failed to get constants. Please try again.",
                    }
                ]
            };
        }
    }
    catch (error) {
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: "text/plain",
                    text: `Error occurred: ${typeof error === "object" && error !== null
                        ? error.headers?.message || error.message || 'Unknown error'
                        : String(error)}`,
                }
            ]
        };
    }
});
// Resource to get constants from BMO system database by making a search with a given query
server.resource("constants-by-query", new mcp_js_1.ResourceTemplate("constants://by-query/{query}", { list: undefined }), {
    description: "Get constants from the BMO system database by making a search with a given query",
    title: "BMO Constants By Query",
    mimeType: "text/plain",
}, async (uri, { query }) => {
    try {
        const loginId = "qwer1234";
        const response = await axios_1.default.get(`http://bmo.localhost/constant/data/csv.php?fieldset=list&=&length=36&search=${query}`, {
            headers: {
                "Content-Type": "text/csv",
                "Cookie": `bmo_LOGINID=${loginId}`,
            }
        });
        if (response.status === 200) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "text/plain",
                        text: JSON.stringify(csvToJson(String(response.data))),
                    }
                ]
            };
        }
        else {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "text/plain",
                        text: "Failed to get constants. Please try again.",
                    }
                ]
            };
        }
    }
    catch (error) {
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: "text/plain",
                    text: `Error occurred: ${typeof error === "object" && error !== null
                        ? error.headers?.message || error.message || 'Unknown error'
                        : String(error)}`,
                }
            ]
        };
    }
});
// Prompt for generating constant values
server.prompt("Generate values for constants", "Generate appropriate values for the given constant type in both English and Turkish languages.", {
    type: zod_1.z.enum(["bolum", "dil", "mevki", "saha", "ilce", "muhesebesebep", "ulke", "egitim"]).describe("Type of the constant"),
}, ({ type }) => {
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Generate suitable values for type "${type}" in Turkish and English.\nExample:\n- tr: Örnek Değer\n- en: Sample Value`
                }
            }
        ]
    };
});
async function startServer() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
startServer();
