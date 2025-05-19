/**
 * JSON-RPC request interface
 */
export interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: any;
}

/**
 * JSON-RPC response interface
 */
export interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: JsonRpcError;
}

/**
 * JSON-RPC error interface
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}
