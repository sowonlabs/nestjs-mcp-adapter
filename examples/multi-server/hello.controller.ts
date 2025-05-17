import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('greet')
export class HelloController {
  @Get('hello')
  async hello() {
    return { message: 'Hello, MCP!' };
  }
}
