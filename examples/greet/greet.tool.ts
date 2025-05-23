import { Injectable } from '@nestjs/common';
import { McpTool } from '@sowonai/nest-mcp-adapter';
import { z } from 'zod';

@Injectable()
export class GreetToolService {
  @McpTool({
    server: 'greet',
    name: 'hello',
    description: 'Say hello to the user.',
    input: {},
    annotations: {
      title: 'Hello',
      readOnlyHint: true,
      desctructiveHint: false,
    }
  })
  async hello() {
    return {
      content: [{ type: 'text', text: 'Hello, MCP!' }]
    };
  }

  @McpTool({
    server: 'greet',
    name: 'helloMessage',
    description: 'Say hello to the user.',
    input: {
      message: z.string()
    },
    annotations: {
      title: 'Hello Message',
      readOnlyHint: true,
      desctructiveHint: false,
    }
  })
  async helloMessage({message}) {
    return {
      content: [{ type: 'text', text: `Hello, ${message || 'MCP'}!` }]
    };
  }

  @McpTool({
    server: 'greet',
    name: `listMessages`,
    description: 'Search and retrieve Gmail messages for the user. By default, returns the 10 most recent emails.',
    input: {
      maxResults: z.number().optional().default(10).describe('Maximum number of results (default: 10)'),
      query: z.string().optional().describe('Gmail search query (e.g., "from:example@gmail.com", "is:unread", "subject:hello")'),
    },
  })
  async listMessages({ maxResults = 10, query = '' }) {
    try {
      const dummyEmails = [
        { subject: "Test Email 1", from: "sender1@example.com", date: new Date().toISOString() },
        { subject: "Test Email 2", from: "sender2@example.com", date: new Date().toISOString() },
      ].slice(0, maxResults);

      return {
        content: [
          { type: 'text', text: `Search criteria: ${query || 'None'}` },
          ...dummyEmails.map(email => ({
            type: 'text', 
            text: `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\n`
          })),
        ]
      };
    } catch (error) {
      console.error('Error in listMessages:', error);
      return {
        content: [{ type: 'text', text: 'An error occurred while fetching the email list.' }],
        isError: true
      };
    }
  }
}
