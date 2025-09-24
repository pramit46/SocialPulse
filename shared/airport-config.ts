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

  // Load all airport configurations from config/list folder
  public static getAllAirportConfigs(): AirportConfig[] {
    const configs: AirportConfig[] = [];
    const configFiles = ['airport-config_BLR.json', 'airport-config_CCU.json', 'airport-config_BOM.json'];
    
    for (const filename of configFiles) {
      try {
        const configPath = path.join(process.cwd(), 'config', 'list', filename);
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          configs.push(configData);
        }
      } catch (error) {
        console.warn(`Failed to load config ${filename}:`, error);
      }
    }
    
    return configs;
  }

  // Get airport keywords from all configurations
  public static getAllAirportKeywords(): string[] {
    const allConfigs = this.getAllAirportConfigs();
    const keywords: string[] = [];
    
    for (const config of allConfigs) {
      // Add airport synonyms
      keywords.push(...config.airport.synonyms);
      
      // Add formatted airport name variants
      const city = config.airport.city.toLowerCase();
      const alternateCity = config.airport.alternateCity.toLowerCase();
      const code = config.airport.code.toLowerCase();
      const airportName = config.airport.airportName.toLowerCase();
      
      keywords.push(
        `${city} airport`,
        `${alternateCity} airport`, 
        `${code} airport`,
        city,
        alternateCity,
        code,
        airportName
      );
    }
    
    // Add general airport terms
    keywords.push('departure', 'arrival', 'flight', 'terminal', 'baggage', 'check-in', 'security', 'lounge');
    
    return Array.from(new Set(keywords.map(k => k.toLowerCase()))); // Remove duplicates and normalize
  }

  // Get airline keywords from all configurations + additional airlines
  public static getAllAirlineKeywords(): string[] {
    const allConfigs = this.getAllAirportConfigs();
    const airlines: string[] = [];
    
    for (const config of allConfigs) {
      airlines.push(...config.airlines.primary);
    }
    
    // Add additional airlines
    airlines.push('akasa air', 'air india express');
    
    return Array.from(new Set(airlines.map(a => a.toLowerCase()))); // Remove duplicates and normalize
  }

  // Extract location focus from text by checking against all airport configs
  public static extractLocationFromText(text: string): string | null {
    const lowercaseText = text.toLowerCase();
    const allConfigs = this.getAllAirportConfigs();
    
    for (const config of allConfigs) {
      const synonyms = config.airport.synonyms.map(s => s.toLowerCase());
      const airportTerms = [
        config.airport.city.toLowerCase(),
        config.airport.alternateCity.toLowerCase(),
        config.airport.code.toLowerCase(),
        config.airport.airportName.toLowerCase()
      ];
      
      const allTerms = [...synonyms, ...airportTerms];
      
      if (allTerms.some(term => lowercaseText.includes(term))) {
        return config.airport.locationSlug;
      }
    }
    
    return null;
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