/**
 * JSON-RPC 요청 인터페이스
 */
export interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: any;
}

/**
 * JSON-RPC 응답 인터페이스
 */
export interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: JsonRpcError;
}

/**
 * JSON-RPC 에러 인터페이스
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}
