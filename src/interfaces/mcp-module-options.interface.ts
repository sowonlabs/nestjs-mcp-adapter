export interface McpServerConfig {
  /**
   * The version of this specific MCP server.
   */
  version?: string;

  /**
   * Instructions for this specific MCP server.
   */
  instructions?: string;
}

export interface McpModuleOptions {
  /**
   * Configuration for multiple MCP servers.
   * Each key is a server name, and the value contains its specific configuration.
   */
  servers?: {
    [serverName: string]: McpServerConfig;
  };
}
