import { Injectable } from '@nestjs/common';
import { McpResource } from '@sowonai/nest-mcp-adapter';

@Injectable()
export class UsersResourceService {
  @McpResource({
    server: ['userinfo', 'calculator'],
    uri: 'users://{userId}/profile',
    description: 'User profile information',
    mimeType: 'text/plain',
  })
  async getUserProfile({ uri, userId }: { uri: string, userId: string }) {
    return {
      contents: [{
        uri,
        text: `User ID: ${userId}\nName: Neo\nPosition: Programmer`
      }]
    };
  }
}
