import { RedditAgent } from './reddit-agent';
import { FacebookAgent } from './facebook-agent';
import { TwitterAgent } from './twitter-agent';
import { CNNAgent } from './cnn-agent';
import { InshortsAgent } from './inshorts-agent';
import { BaseAgent } from './base-agent';
import { DataSourceCredentials, InsertSocialEvent } from '@shared/schema';

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();

  constructor() {
    // Initialize all agents
    this.agents.set('reddit', new RedditAgent());
    this.agents.set('facebook', new FacebookAgent());
    this.agents.set('twitter', new TwitterAgent());
    this.agents.set('cnn', new CNNAgent());
    this.agents.set('inshorts', new InshortsAgent());
    // Add more agents as needed
  }

  setCredentials(source: string, credentials: DataSourceCredentials) {
    const agent = this.agents.get(source);
    if (agent) {
      agent.setCredentials(credentials);
    } else {
      throw new Error(`Agent not found for source: ${source}`);
    }
  }

  async collectData(source: string, query?: string): Promise<InsertSocialEvent[]> {
    const agent = this.agents.get(source);
    if (!agent) {
      throw new Error(`Agent not found for source: ${source}`);
    }

    if (!agent.validateCredentials()) {
      throw new Error(`Invalid credentials for source: ${source}`);
    }

    const defaultQuery = "bangalore airport OR bengaluru airport OR kempegowda airport OR indigo OR spicejet OR air india OR vistara";
    return await agent.collectData(query || defaultQuery);
  }

  validateCredentials(source: string): boolean {
    const agent = this.agents.get(source);
    return agent ? agent.validateCredentials() : false;
  }

  getSupportedSources(): string[] {
    return Array.from(this.agents.keys());
  }

  getAgent(source: string): BaseAgent | undefined {
    return this.agents.get(source);
  }
}

export const agentManager = new AgentManager();