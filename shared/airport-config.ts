import fs from 'fs';
import path from 'path';

// TypeScript interfaces for the configuration
export interface AirportConfig {
  _meta: {
    description: string;
    version: string;
    instructions: string;
  };
  airport: {
    code: string;
    city: string;
    alternateCity: string;
    airportName: string;
    synonyms: string[];
    locationSlug: string;
    usage: string[];
  };
  airlines: {
    primary: string[];
    usage: string[];
  };
  queryTerms: {
    general: string[];
    services: string[];
    experience: string[];
    usage: string[];
  };
  ui: {
    botName: string;
    botDisplayNameTemplate: string;
    appTitleTemplate: string;
    greetingTemplate: string;
    capabilitiesTemplate: string;
    scopeDescriptionTemplate: string;
    rejectionTemplate: string;
    consentPromptTemplate: string;
    usage: string[];
  };
  dataCollection: {
    defaultQueryTemplate: string;
    collectionNameTemplate: string;
    searchTerms: {
      reddit: {
        airport: string;
        airlines: string[];
      };
      news: {
        keywords: string[];
      };
    };
    userAgents: {
      reddit: string;
      general: string;
    };
    usage: string[];
  };
  wordCloud: {
    extraAllowedTerms: string[];
    airportSpecificTerms: string[];
    usage: string[];
  };
  security: {
    promptInjectionPatterns: string[];
    conversationStarters: string[];
    outOfScopeTerms: string[];
    usage: string[];
  };
}

// Singleton configuration loader
class AirportConfigLoader {
  private static instance: AirportConfigLoader;
  private config: AirportConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = path.resolve(process.cwd(), 'config/airport-config.json');
  }

  public static getInstance(): AirportConfigLoader {
    if (!AirportConfigLoader.instance) {
      AirportConfigLoader.instance = new AirportConfigLoader();
    }
    return AirportConfigLoader.instance;
  }

  public loadConfig(): AirportConfig {
    if (!this.config) {
      try {
        const rawData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(rawData) as AirportConfig;
        console.log(`✅ Airport configuration loaded: ${this.config.airport.city} (${this.config.airport.code})`);
      } catch (error) {
        console.error('❌ Failed to load airport configuration:', error);
        throw new Error('Airport configuration could not be loaded');
      }
    }
    return this.config;
  }

  public reloadConfig(): AirportConfig {
    this.config = null;
    return this.loadConfig();
  }

  public getConfig(): AirportConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }
}

// Helper functions for configuration usage
export class AirportConfigHelper {
  private static loader = AirportConfigLoader.getInstance();

  public static getConfig(): AirportConfig {
    return this.loader.getConfig();
  }

  public static reloadConfig(): AirportConfig {
    return this.loader.reloadConfig();
  }

  // Template string interpolation
  public static formatTemplate(template: string, config?: AirportConfig, extraVars?: Record<string, string>): string {
    const cfg = config || this.getConfig();
    const variables = {
      code: cfg.airport.code,
      city: cfg.airport.city,
      alternateCity: cfg.airport.alternateCity,
      airportName: cfg.airport.airportName,
      locationSlug: cfg.airport.locationSlug,
      botName: cfg.ui.botName,
      ...extraVars
    };

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  // Get formatted UI messages
  public static getGreeting(): string {
    const config = this.getConfig();
    return this.formatTemplate(config.ui.greetingTemplate);
  }

  public static getCapabilities(): string {
    const config = this.getConfig();
    return this.formatTemplate(config.ui.capabilitiesTemplate);
  }

  public static getRejection(): string {
    const config = this.getConfig();
    return this.formatTemplate(config.ui.rejectionTemplate);
  }

  public static getConsentPrompt(topic: string): string {
    const config = this.getConfig();
    return this.formatTemplate(config.ui.consentPromptTemplate, config, { topic });
  }

  public static getBotDisplayName(): string {
    const config = this.getConfig();
    return this.formatTemplate(config.ui.botDisplayNameTemplate);
  }

  public static getAppTitle(): string {
    const config = this.getConfig();
    return this.formatTemplate(config.ui.appTitleTemplate);
  }

  // Get ChromaDB collection name
  public static getCollectionName(): string {
    const config = this.getConfig();
    return this.formatTemplate(config.dataCollection.collectionNameTemplate);
  }

  // Get default query for agents
  public static buildDefaultQuery(): string {
    const config = this.getConfig();
    const airportSynonyms = config.airport.synonyms.join(' OR ');
    const airlines = config.airlines.primary.join(' OR ');
    return this.formatTemplate(config.dataCollection.defaultQueryTemplate, config, {
      airportSynonyms,
      airlines
    });
  }

  // Get Reddit search terms
  public static getRedditSearchTerms(): string[] {
    const config = this.getConfig();
    const airportTerm = this.formatTemplate(config.dataCollection.searchTerms.reddit.airport);
    const airlineTerms = config.dataCollection.searchTerms.reddit.airlines.map(term => 
      this.formatTemplate(term)
    );
    return [airportTerm, ...airlineTerms];
  }

  // Get news search keywords
  public static getNewsSearchKeywords(): string[] {
    const config = this.getConfig();
    return config.dataCollection.searchTerms.news.keywords.map(keyword => 
      this.formatTemplate(keyword)
    );
  }

  // Get configured user agents
  public static getUserAgent(platform: 'reddit' | 'general'): string {
    const config = this.getConfig();
    return this.formatTemplate(config.dataCollection.userAgents[platform]);
  }

  // Get all airport keywords for intent validation
  public static getAirportKeywords(): string[] {
    const config = this.getConfig();
    return [
      ...config.queryTerms.general,
      ...config.airport.synonyms,
      ...config.airlines.primary
    ];
  }

  // Get airline names for intent validation
  public static getAirlineNames(): string[] {
    const config = this.getConfig();
    return [...config.airlines.primary, ...config.airport.synonyms];
  }

  // Get location focus keywords for agents
  public static getLocationKeywords(): string[] {
    const config = this.getConfig();
    return config.airport.synonyms;
  }

  // Get location slug for normalization
  public static getLocationSlug(): string {
    const config = this.getConfig();
    return config.airport.locationSlug;
  }

  // Security patterns
  public static getPromptInjectionPatterns(): string[] {
    const config = this.getConfig();
    return config.security.promptInjectionPatterns;
  }

  public static getConversationStarters(): string[] {
    const config = this.getConfig();
    return config.security.conversationStarters;
  }

  public static getOutOfScopeTerms(): string[] {
    const config = this.getConfig();
    return config.security.outOfScopeTerms;
  }

  // Word cloud terms
  public static getWordCloudTerms(): string[] {
    const config = this.getConfig();
    const formattedTerms = config.wordCloud.airportSpecificTerms.map(term => 
      this.formatTemplate(term)
    );
    return [...config.wordCloud.extraAllowedTerms, ...formattedTerms];
  }
}

// Export the default instance
export default AirportConfigHelper;