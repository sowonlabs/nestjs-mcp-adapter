import { Injectable } from '@nestjs/common';
import { McpResource } from '../../src/decorators/mcp-resource.decorator';

@Injectable()
export class UsersResourceService {
  @McpResource({
    server: ['mcp-userinfo', 'mcp-calculator'],
    uri: 'users://{userId}/profile',
    description: '사용자 프로필 정보',
    mimeType: 'text/plain',
  })
  async getUserProfile({ uri, userId }: { uri: string, userId: string }) {
    return {
      contents: [{
        uri,
        text: `사용자 ID: ${userId}\n이름: 홍길동\n직책: 개발자`
      }]
    };
  }
}
