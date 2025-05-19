import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { StdioHttpProxy } from './stdio-http-proxy';

export class StdioExpressAdapter extends ExpressAdapter {
  private stdioProxy: StdioHttpProxy;
  private contextPath: string;

  constructor(contextPath: string = '/mcp') {
    super(express());
    this.contextPath = contextPath;

    const transformInput = (input: string) => {
      return {
        method: 'POST',
        path: this.contextPath,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.parse(input)
      };
    };

    // Default output transform function - standard JSON format
    const transformOutput = (responseData: any) => {
      return JSON.stringify(responseData.body);
    };

    // Pass transform functions to StdioHttpProxy
    this.stdioProxy = new StdioHttpProxy(
      this.getInstance(),
      transformInput,
      transformOutput
    );
  }
  
  /**
   * Initializes the HTTP server. This is a virtual server that does not actually bind to the network.
   */
  public initHttpServer() {
    // Use the proxy's server instead of creating a real HTTP server
    this.httpServer = this.stdioProxy.getHttpServer();
  }
  
  /**
   * Starts virtual listening and sets up STDIO handler.
   */
  public listen(port: any, ...args: any[]) {
    // If the last argument is a function, treat it as a callback
    let callback: Function | undefined;
    if (args.length > 0 && typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
    }
    
    return this.stdioProxy.listen(port, callback as any);
  }
  
  /**
   * Closes the virtual server.
   */
  public async close() {
    this.stdioProxy.close();
  }
  
  /**
   * Handles input manually. Mainly used for testing.
   */
  public handleInput(input: string) {
    this.stdioProxy.handleInput(input);
  }

  /**
   * Replaces the input transform function.
   */
  public setTransformInput(fn: (input: string) => any): void {
    this.stdioProxy.setTransformInput(fn);
  }

  /**
   * Replaces the output transform function.
   */
  public setTransformOutput(fn: (responseData: any) => string): void {
    this.stdioProxy.setTransformOutput(fn);
  }
}
