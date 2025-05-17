import * as http from 'http';
import * as readline from 'readline';
import { IncomingMessage, ServerResponse } from 'http';
import { Readable, Writable } from 'stream';
import { Logger } from '@nestjs/common';

/**
 * StdioHttpProxy는 HTTP 서버를 실제로 열지 않고 STDIO를 통해 요청/응답을 주고받을 수 있게 해주는 프록시입니다.
 * 표준 입력(stdin)을 통해 HTTP 요청 형식의 데이터를 받고 Express에 전달하며,
 * Express의 응답은 표준 출력(stdout)으로 전달합니다.
 */
export class StdioHttpProxy {
  private app: any; // Express 애플리케이션
  private server: http.Server;
  private rl!: readline.Interface; // ! 연산자로 명시적 초기화 지연 표시
  private isReady = false;
  private transformInput: (input: string) => any;
  private transformOutput: (responseData: any) => string;

  constructor(
    app: any,
    transformInput?: (input: string) => any,
    transformOutput?: (responseData: any) => string
  ) {
    this.app = app;
    this.server = http.createServer(app);

    // 기본 변환 함수는 단순히 JSON 파싱
    this.transformInput = transformInput || ((input: string) => JSON.parse(input));

    // 기본 출력 변환 함수는 JSON 형식으로 출력
    this.transformOutput = transformOutput || ((responseData: any) => JSON.stringify(responseData));
  }

  /**
   * 입력 변환 함수를 설정합니다.
   */
  public setTransformInput(fn: (input: string) => any): void {
    this.transformInput = fn;
  }

  /**
   * 출력 변환 함수를 설정합니다.
   */
  public setTransformOutput(fn: (responseData: any) => string): void {
    this.transformOutput = fn;
  }

  /**
   * STDIO 핸들러를 설정합니다. 표준 입력에서 들어오는 메시지를 처리합니다.
   */
  public setupStdioHandlers() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    this.rl.on('line', (line) => this.handleInput(line));
    this.isReady = true;

    // 프로세스 종료 처리
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }
  
  /**
   * 리소스를 정리합니다.
   */
  private cleanup() {
    if (this.rl) {
      this.rl.close();
    }
  }

  /**
   * 표준 입력으로 들어온 데이터를 처리합니다.
   */
  public handleInput(input: string) {
    try {
      // 빈 입력은 무시
      if (!input || input.trim() === '') {
        return;
      }
      
      // 입력된 JSON 파싱
      const requestData = this.transformInput(input);

      // 요청 및 응답 객체 생성
      const req = this.createRequest(requestData);
      const res = this.createResponse();
      
      // Express 앱에 요청 전달
      this.app(req, res);
    } catch (error) {
      this.sendErrorResponse(error);
    }
  }

  /**
   * 요청 데이터를 기반으로 HTTP 요청 객체를 생성합니다.
   */
  private createRequest(data: any): IncomingMessage {
    // IncomingMessage 객체 생성 및 데이터 설정
    const req = new http.IncomingMessage(new Readable({
      read() {} // 기본 read 메소드 구현 (필수)
    }) as any);
    
    // 기본 속성 설정
    req.method = (data.method || 'GET').toUpperCase();
    req.url = data.path || '/';
    req.headers = data.headers || { 
      'content-type': 'application/json',
      'user-agent': 'StdioHttpProxy/1.0'
    };
    
    // 요청 바디 설정
    if (data.body) {
      (req as any).body = data.body;
    }
    
    return req;
  }

  /**
   * 표준 출력으로 응답을 전송할 수 있는 HTTP 응답 객체를 생성합니다.
   */
  private createResponse(): ServerResponse {
    // this 컨텍스트 저장 (클로저에서 사용하기 위함)
    const self = this;

    // ServerResponse 객체 생성
    const writable = new Writable({
      write: (chunk, encoding, callback) => {
        callback();
      }
    });
    
    const res = new http.ServerResponse(new IncomingMessage(writable as any));
    
    // 원본 end 메소드 저장
    const originalEnd = res.end;
    
    // end 메소드 오버라이드
    res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
      const body = JSON.parse(chunk);

      // 응답 데이터 수집
      const responseData = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.getHeaders(),
        body: body
      };
      
      // 변환 함수를 통해 출력 형식 결정
      console.log(self.transformOutput(responseData));

      // 원본 end 메소드 호출 - 타입 안전성을 위한 처리
      if (typeof encoding === 'function') {
        // encoding이 함수인 경우 (콜백으로 사용된 경우)
        return (originalEnd as any).call(res, chunk, encoding);
      } else if (encoding === undefined) {
        // encoding이 제공되지 않은 경우
        return (originalEnd as any).call(res, chunk);
      } else {
        // 모든 매개변수가 제공된 경우
        return (originalEnd as any).call(res, chunk, encoding, cb);
      }
    } as any;
    
    // json 메소드 추가
    (res as any).json = function(data: any) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
    
    return res;
  }

  /**
   * 오류 응답을 표준 출력으로 전송합니다.
   */
  private sendErrorResponse(error: any) {
    const errorResponse = {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Unknown error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
    
    // 변환 함수를 사용하여 오류 응답 출력
    console.log(this.transformOutput(errorResponse));
  }

  /**
   * HTTP 서버 객체를 반환합니다.
   */
  public getHttpServer() {
    return this.server;
  }
  
  /**
   * 가상의 리스닝 상태를 시작합니다.
   */
  public listen(port: number, callback?: () => void) {
    if (!this.isReady) {
      this.setupStdioHandlers();
    }
    
    if (callback) callback();
    return this.server;
  }
  
  /**
   * 프록시 서버를 닫습니다.
   */
  public close(callback?: () => void) {
    this.cleanup();
    if (callback) callback();
  }
}
