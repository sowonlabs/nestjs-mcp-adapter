# @sowonai/nestjs-mcp-adapter

## Specification of protocol

### Initialize
Request:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "initialize",
  "params": {
    "protocolVersion": "프로토콜 버전",
    "clientInfo": {
      "name": "클라이언트 이름",
      "version": "클라이언트 버전"
    },
    "capabilities": {
    }
  }
}
```
Response:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "protocolVersion": "프로토콜 버전",
    "capabilities": {
    },
    "serverInfo": {
      "name": "서버 이름",
      "version": "서버 버전"
    },
    "instructions": "사용 지침(선택사항)"
  }
}
```
## SSE Chunk
```
event: message
data: {"result":{"tools":[{"name":"hello","description":"Say hello to the user.","inputSchema":{"type":"object"}},{"name":"helloMessage","description":"Say hello to the user.","inputSchema":{"type":"object"}}]},"jsonrpc":"2.0","id":"1"}
```
{"jsonrpc": "2.0","method": "notifications/initialized"}
{"jsonrpc":"2.0","id":"1","method":"ping"}
{"jsonrpc": "2.0","id": "1","method": "initialize","params": {"protocolVersion": "2025-03-26","capabilities": {},"clientInfo": {"name": "test","version": "0.1.0"}}}

```json
{"jsonrpc":"2.0","id":"2","method":"tools/list"}
```

```json
{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"hello","arguments":{}}}
```

```json
{"method":"GET","path":"/greet/hello"}
```

```json
{"method":"POST","path":"/mcp"}
```

```json
{"method":"POST","path":"/mcp/mcp-multi-server","body":{"jsonrpc":"2.0","id":"1","method":"tools/list"}}
```
