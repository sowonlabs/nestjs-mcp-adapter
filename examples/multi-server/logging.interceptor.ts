import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express'; // Import Express Response type

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<any>(); // Express Request
    const response = httpContext.getResponse<Response>(); // Express Response

    const { method, url, body: requestBody } = request;
    console.log(`[REQ] ${method} ${url}`);
    if (requestBody && Object.keys(requestBody).length > 0) {
      try {
        console.log('[REQ] Payload:', JSON.stringify(requestBody, null, 2));
      } catch (e) {
        console.log('[REQ] Payload (Not JSON serializable):', requestBody);
      }
    } else {
      console.log('[REQ] Payload: (None)');
    }

    const now = Date.now();

    // Modify response.json method to log response body
    const originalJson = response.json;
    response.json = (body) => {
      try {
        console.log('[RES] Payload (JSON):', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('[RES] Payload (JSON, Not JSON serializable):', body);
      }
      return originalJson.call(response, body); // Call original json method
    };

    // Modify response.send method to log other types of response bodies (if necessary)
    const originalSend = response.send;
    response.send = (body) => {
      if (body) {
        if (typeof body === 'string') {
          try {
            // Check if it's a JSON string and pretty-print
            const parsedJson = JSON.parse(body);
            console.log('[RES] Payload (send, JSON string):', JSON.stringify(parsedJson, null, 2));
          } catch (e) {
            console.log('[RES] Payload (send, string):', body);
          }
        } else if (Buffer.isBuffer(body)) {
          console.log('[RES] Payload (send, buffer):', body.toString());
        } else if (typeof body === 'object') {
          try {
            console.log('[RES] Payload (send, object):', JSON.stringify(body, null, 2));
          } catch (e) {
            console.log('[RES] Payload (send, object, Not JSON serializable):', body);
          }
        } else {
          console.log('[RES] Payload (send):', body);
        }
      } else {
        console.log('[RES] Payload (send): (None)');
      }
      return originalSend.call(response, body); // Call original send method
    };

    return next
      .handle()
      .pipe(
        tap({
          next: (handlerReturnValue) => {
            // Value returned by McpController's handlePost method (ServerResponse object)
            // Actual response body logging is handled by the patched methods above.
            console.log(`[INFO] Handler completed. Processing time: ${Date.now() - now}ms`);
          },
          error: (err) => {
            console.error(`[ERR] Error during request processing: ${err.message || err}`, err.stack);
            console.log(`[INFO] Request failed. Processing time: ${Date.now() - now}ms`);
          }
        })
      );
  }
}

