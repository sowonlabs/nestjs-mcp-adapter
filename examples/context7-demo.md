# Testing with Context7 MCP Client

This guide demonstrates how to test MCP Resource and Prompt protocol functionality using the Context7 MCP client.

## Prerequisites

- Node.js installed
- The Context7 MCP client package (`@upstash/context7-mcp`)

## Setup

The VS Code config (.vscode/mcp.json) already includes the Context7 MCP server configuration:

```json
{
  "servers": {
    "Context7": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest"
      ]
    }
  }
}
```

## Testing Steps

1. Start the MCP server in one terminal:

```bash
npm run example:multi:stdio
```

2. In another terminal, use npx to run the context7-mcp client:

```bash
npx @upstash/context7-mcp@latest
```

3. Test the Resources protocol:

```
# List all resources
resources/list

# Get a specific resource
resources/get --uri "users://{userId}/profile"
```

4. Test the Prompts protocol:

```
# List all prompts
prompts/list
```

## Expected Results

### resources/list
Should return a list of available resources including the user profile resource.

### resources/get
Should return the user profile resource data.

### prompts/list
Should return a list of available prompts including the 'summarize' and 'math-helper' prompts.

## Additional Testing

You can also test the functionality programmatically using the provided test files:

```bash
npm test
```

This will run all test files, including:
- stdio.test.ts - Tests basic initialization and tool calls
- resources.test.ts - Tests resources/list and resources/get endpoints
- prompts.test.ts - Tests prompts/list endpoint