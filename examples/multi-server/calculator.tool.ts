import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src/decorators/mcp-tool.decorator';
import { z } from 'zod';

@Injectable()
export class CalculatorToolService {
  @McpTool({
    server: 'mcp-calculator',
    name: 'calculate',
    description: '수학 연산 수행을 수행합니다.',
    input: z.object({
      a: z.number().describe('첫번째 숫자'),
      b: z.number().describe('두번째 숫자'),
      operation: z.string().describe('연산 타입')
    }),
    annotations: {
      title: 'Calculate',
      readOnlyHint: true,
      desctructiveHint: false,
    }
  })
  async calculate(params: any) {
    const { a, b, operation } = params;
    let result: number;
    
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          throw new Error('0으로 나눌 수 없습니다.');
        }
        result = a / b;
        break;
      default:
        throw new Error('지원되지 않는 연산입니다.');
    }
    
    return {
      content: [{ type: 'text', text: String(result) }]
    };
  }
}
