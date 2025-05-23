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
    console.warn(`[REQ] ${method} ${url}`);
    if (requestBody && Object.keys(requestBody).length > 0) {
      try {
        console.warn('[REQ] Payload:', JSON.stringify(requestBody, null, 2));
      } catch (e) {
        console.warn('[REQ] Payload (Not JSON serializable):', requestBody);
      }
    } else {
      console.warn('[REQ] Payload: (None)');
    }

    const now = Date.now();

    // Modify response.json method to log response body
    const originalJson = response.json;
    response.json = (body) => {
      try {
        console.warn('[RES] Payload (JSON):', JSON.stringify(body, null, 2));
      } catch (e) {
        console.warn('[RES] Payload (JSON, Not JSON serializable):', body);
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
            console.warn('[RES] Payload (send, JSON string):', JSON.stringify(parsedJson, null, 2));
          } catch (e) {
            console.warn('[RES] Payload (send, string):', body);
          }
        } else if (Buffer.isBuffer(body)) {
          console.warn('[RES] Payload (send, buffer):', body.toString());
        } else if (typeof body === 'object') {
          try {
            console.warn('[RES] Payload (send, object):', JSON.stringify(body, null, 2));
          } catch (e) {
            console.warn('[RES] Payload (send, object, Not JSON serializable):', body);
          }
        } else {
          console.warn('[RES] Payload (send):', body);
        }
      } else {
        console.warn('[RES] Payload (send): (None)');
      }
      return originalSend.call(response, body); // Call original send method
    };

    return next
      .handle()
      .pipe(
        tap({
          next: (handlerReturnValue) => {
            console.warn(`[INFO] Handler completed. Processing time: ${Date.now() - now}ms`);
          },
          error: (err) => {
            console.error(`[ERR] Error during request processing: ${err.message || err}`, err.stack);
          }
        })
      );
  }
}

