import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src/decorators/mcp-tool.decorator';
import { z } from 'zod';

@Injectable()
export class CalculatorToolService {
  @McpTool({
    server: 'mcp-calculator',
    name: 'calculate',
    description: 'Performs mathematical operations.',
    input: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
      operation: z.string().describe('Operation type')
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
          throw new Error('Cannot divide by zero.');
        }
        result = a / b;
        break;
      default:
        throw new Error('Unsupported operation.');
    }
    
    return {
      content: [{ type: 'text', text: String(result) }]
    };
  }
}
