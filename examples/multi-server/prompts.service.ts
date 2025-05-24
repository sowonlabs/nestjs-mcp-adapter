import { Injectable } from '@nestjs/common';
import { McpPrompt } from '../../src/decorators/mcp-prompt.decorator';

@Injectable()
export class PromptsService {
  @McpPrompt({
    server: ['mcp-userinfo', 'mcp-calculator'],
    name: 'summarize',
    description: 'Summarize the given text',
    prompt: 'Summarize the following text in 3 bullet points:\n\n{text}',
    annotations: {
      title: 'Text Summarizer',
      category: 'Text Processing',
    },
  })
  async getSummarizePrompt() {
    return {
      result: 'Summarize the following text in 3 bullet points:\n\n{text}',
    };
  }

  @McpPrompt({
    server: 'mcp-calculator',
    name: 'math-helper',
    description: 'Helper prompt for solving math problems',
    prompt: 'Step by step, solve the following math problem:\n\n{problem}',
    annotations: {
      title: 'Math Problem Solver',
      category: 'Mathematics',
      tags: ['math', 'education'],
    },
  })
  async getMathHelperPrompt() {
    return {
      result: 'Step by step, solve the following math problem:\n\n{problem}',
    };
  }
}