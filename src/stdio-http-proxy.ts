import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { Readable, Writable } from 'stream';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ErrorCode } from './errors';

/**
 * StdioHttpProxy is a proxy that allows request/response exchange via STDIO without actually opening an HTTP server.
 * It receives HTTP request-formatted data via standard input (stdin), passes it to Express,
 * and sends Express's response to standard output (stdout).
 */
export class StdioHttpProxy {
  private app: any;
  private server: http.Server;
  private isReady = false;
  private transport: StdioServerTransport;
  private transformInput: (input: string) => any;
  private transformOutput: (responseData: any) => string;

  constructor(
    app: any,
    transformInput?: (input: string) => any,
    transformOutput?: (responseData: any) => string
  ) {
    this.app = app;
    this.server = http.createServer(app);

    // Initialize transport
    this.transport = new StdioServerTransport();

    // Set transport event handlers
    this.transport.onmessage = (message) => this.handleInput(JSON.stringify(message));
    this.transport.onerror = (error: any) => {
      // Check if the error is the specific JSON parsing error for empty input
      if (error && typeof error.message === 'string' && error.message.includes('Unexpected end of JSON input')) {
        // Suppress this specific error, as it's likely due to an empty line (Enter key)
        // console.log('StdioHttpProxy: Empty input line detected and ignored.'); // Optional: log a more benign message
      } else {
        // Log other errors as before
        console.error('Transport error:', error);
      }
    };
    this.transport.onclose = () => console.log('Transport connection closed');

    // Default transform function simply parses JSON
    this.transformInput = transformInput || ((input: string) => JSON.parse(input));

    // Default output transform function outputs in JSON format
    this.transformOutput = transformOutput || ((responseData: any) => JSON.stringify(responseData));
  }

  /**
   * Sets the input transform function.
   */
  public setTransformInput(fn: (input: string) => any): void {
    this.transformInput = fn;
  }

  /**
   * Sets the output transform function.
   */
  public setTransformOutput(fn: (responseData: any) => string): void {
    this.transformOutput = fn;
  }

  /**
   * Sets up STDIO handlers. Processes messages coming from standard input.
   */
  public async setupStdioHandlers() {
    try {
      await this.transport.start();
      this.isReady = true;
    } catch (error) {
      console.error('Error starting transport:', error);
      throw error;
    }
  }
  
  /**
   * Cleans up resources.
   */
  private async cleanup() {
    try {
      await this.transport.close();
    } catch (error) {
      console.error('Error closing transport:', error);
    }

    if (this.server) {
      this.server.close();
    }
  }

  /**
   * Processes data received from standard input.
   */
  public handleInput(input: string) {
    if (!input || input.trim() === '') {
      // Ignore empty lines
      return;
    }
    try {
      // Ignore empty input
      if (!input || input.trim() === '') {
        return;
      }
      
      // Parse incoming JSON
      const requestData = this.transformInput(input);

      // Create request and response objects
      const req = this.createRequest(requestData);
      const res = this.createResponse();
      
      // Pass request to Express app
      this.app(req, res);
    } catch (error) {
      this.sendErrorResponse(error);
    }
  }

  /**
   * Creates an HTTP request object from the provided data.
   */
  private createRequest(data: any): IncomingMessage {
    // IncomingMessage object creation and data setting
    const req = new http.IncomingMessage(new Readable({
      read() {} // Default read method implementation (required)
    }) as any);
    
    // Default properties setting
    req.method = (data.method || 'GET').toUpperCase();
    req.url = data.path || '/';
    req.headers = data.headers || { 
      'content-type': 'application/json',
      'user-agent': 'StdioHttpProxy/1.0'
    };
    
    // Request body setting
    if (data.body) {
      (req as any).body = data.body;
    }
    
    return req;
  }

  /**
   * Creates an HTTP response object that can send responses to standard output.
   */
  private createResponse(): ServerResponse {
    // Save this context (for use in closure)
    const self = this;

    // ServerResponse object creation
    const writable = new Writable({
      write: (chunk, encoding, callback) => {
        callback();
      }
    });
    
    const res = new http.ServerResponse(new IncomingMessage(writable as any));
    
    // Save original method reference
    const originalEnd = res.end;
    
    // Override end method
    res.end = function(chunk?: any, encoding?: any, cb?: () => void): ServerResponse {
      try {
        // If chunk is empty or an empty string, treat it as an empty object
        const body = chunk ? JSON.parse(chunk) : {};
        
        // Collect response data
        const responseData = {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.getHeaders(),
          body: body
        };
        
        // Determine output format through transform function and send via transport
        if (chunk) {
          const formattedResponse = self.transformOutput(responseData);
          self.transport.send(JSON.parse(formattedResponse)).catch(err => {
            console.error('Error sending response:', err);
            // Fallback to console.log
            console.log(formattedResponse);
          });
        }
      } catch (error) {
        console.error('Error processing response:', error);
        // Continue even if an error occurs (to prevent the entire process from stopping due to response processing failure)
      }
      
      // Call original end method with an empty object (no actual data transmission)
      // For type safety
      if (typeof encoding === 'function') {
        return originalEnd.call(res, '', encoding);
      } else if (encoding === undefined) {
        return originalEnd.call(res, '');
      } else {
        return originalEnd.call(res, '', encoding, cb);
      }
    } as any;
    
    return res;
  }

  /**
   * Sends an error response to standard output.
   */
  private async sendErrorResponse(error: any) {
    // Send error response using transport
    try {
      await this.transport.send({
        jsonrpc: '2.0',
        error: {
          code: error.code || ErrorCode.InternalError,
          message: error.message || 'Internal Server Error',
        },
        id: '0' // Use '0' as the default ID value instead of null
      });
    } catch (err) {
      // Print to console on send error (fallback)
      console.error('Error sending error response:', err);
    }
  }

  /**
   * Returns the underlying HTTP server instance.
   */
  public getHttpServer() {
    return this.server;
  }
  
  /**
   * Starts listening for STDIO messages.
   */
  public async listen(port: number, callback?: () => void) {
    if (!this.isReady) {
      await this.setupStdioHandlers();
    }
    
    if (callback) callback();
    return this.server;
  }
  
  /**
   * Closes the proxy and cleans up resources.
   */
  public async close(callback?: () => void) {
    await this.cleanup();
    if (callback) callback();
  }
}
