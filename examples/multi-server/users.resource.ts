import { Injectable } from '@nestjs/common';
import { McpResource } from '../../src/decorators/mcp-resource.decorator';

@Injectable()
export class UsersResourceService {
  @McpResource({
    server: ['mcp-userinfo', 'mcp-calculator'],
    uri: 'users://{userId}/profile',
    description: 'User profile information',
    mimeType: 'text/plain',
  })
  async getUserProfile({ uri, userId }: { uri: string, userId: string }) {
    return {
      contents: [{
        uri,
        text: `User ID: ${userId}\nName: Hong Gil-dong\nPosition: Developer`
      }]
    };
  }
}
