# @sowonai/nestjs-mcp-adapter

## Specification of protocol

## SSE Chunk
```
event: message
data: {"result":{"tools":[{"name":"hello","description":"Say hello to the user.","inputSchema":{"type":"object"}},{"name":"helloMessage","description":"Say hello to the user.","inputSchema":{"type":"object"}}]},"jsonrpc":"2.0","id":"1"}
```

## initialize request
```json
{"jsonrpc": "2.0","id": "1","method": "initialize","params": {"protocolVersion": "2025-03-26","capabilities": {},"clientInfo": {"name": "test","version": "0.1.0"}}}
```

## ping request
```json
{"jsonrpc":"2.0","id":"1","method":"ping"}
```

## notifications/initialized request
```json
{"jsonrpc": "2.0","method": "notifications/initialized"}
```

## tools/list request
```json
{"jsonrpc":"2.0","id":"2","method":"tools/list"}
```

## tools/call request
```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"hello","arguments":{}}}
```
