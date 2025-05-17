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

    // 기본 출력 변환 함수 - 표준 JSON 형식
    const transformOutput = (responseData: any) => {
      return JSON.stringify(responseData.body);
    };

    // 변환 함수를 StdioHttpProxy에 전달
    this.stdioProxy = new StdioHttpProxy(
      this.getInstance(),
      transformInput,
      transformOutput
    );
  }
  
  /**
   * HTTP 서버를 초기화합니다. 실제로 네트워크에 바인딩되지 않는 가상 서버입니다.
   */
  public initHttpServer() {
    // 실제 HTTP 서버 생성하지 않고 프록시의 서버를 사용
    this.httpServer = this.stdioProxy.getHttpServer();
  }
  
  /**
   * 가상의 리스닝을 시작하고 STDIO 처리 핸들러를 설정합니다.
   */
  public listen(port: any, ...args: any[]) {
    // 마지막 인자가 함수인 경우 콜백으로 처리
    let callback: Function | undefined;
    if (args.length > 0 && typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
    }
    
    return this.stdioProxy.listen(port, callback as any);
  }
  
  /**
   * 가상 서버를 종료합니다.
   */
  public async close() {
    this.stdioProxy.close();
  }
  
  /**
   * 수동으로 입력을 처리합니다. 주로 테스트용으로 사용됩니다.
   */
  public handleInput(input: string) {
    this.stdioProxy.handleInput(input);
  }

  /**
   * 입력 변환 함수를 교체합니다.
   */
  public setTransformInput(fn: (input: string) => any): void {
    this.stdioProxy.setTransformInput(fn);
  }

  /**
   * 출력 변환 함수를 교체합니다.
   */
  public setTransformOutput(fn: (responseData: any) => string): void {
    this.stdioProxy.setTransformOutput(fn);
  }
}
