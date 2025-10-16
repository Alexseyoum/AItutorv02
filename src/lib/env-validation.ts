// File: src/lib/env-validation.ts

/**
 * Production Environment Validation
 * Validates all required environment variables for production deployment
 */

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  BETTER_AUTH_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  
  // AI Providers
  GROQ_API_KEY: string;
  HUGGINGFACE_TOKEN?: string; // Optional fallback
  OPENROUTER_API_KEY?: string; // Optional fallback
  
  // Email
  NODEMAILER_USER: string;
  NODEMAILER_APP_PASSWORD: string;
  
  // Admin
  ADMIN_EMAILS?: string;
  
  // Environment
  NODE_ENV: 'development' | 'production' | 'test';
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.validateAndLoadEnvironment();
  }

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private validateAndLoadEnvironment(): EnvironmentConfig {
    // Validate required environment variables
    const requiredVars = [
      'DATABASE_URL',
      'BETTER_AUTH_URL',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GROQ_API_KEY',
      'NODEMAILER_USER',
      'NODEMAILER_APP_PASSWORD',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(
        `❌ Missing required environment variables: ${missingVars.join(', ')}\n` +
        `📄 Please check your .env file and ensure all required variables are set.\n` +
        `📋 Refer to .env.example for the complete list of required variables.`
      );
    }

    // Validate URLs
    this.validateUrl('DATABASE_URL', process.env.DATABASE_URL!);
    this.validateUrl('BETTER_AUTH_URL', process.env.BETTER_AUTH_URL!);

    // Validate email format
    this.validateEmail('NODEMAILER_USER', process.env.NODEMAILER_USER!);

    // Validate OAuth credentials format
    this.validateOAuthCredentials();

    // Validate AI API keys
    this.validateApiKeys();

    return {
      DATABASE_URL: process.env.DATABASE_URL!,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
      GROQ_API_KEY: process.env.GROQ_API_KEY!,
      HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      NODEMAILER_USER: process.env.NODEMAILER_USER!,
      NODEMAILER_APP_PASSWORD: process.env.NODEMAILER_APP_PASSWORD!,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    };
  }

  private validateUrl(name: string, url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error(`❌ Invalid URL format for ${name}: ${url}`);
    }
  }

  private validateEmail(name: string, email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`❌ Invalid email format for ${name}: ${email}`);
    }
  }

  private validateOAuthCredentials(): void {
    const githubClientId = process.env.GITHUB_CLIENT_ID!;
    const googleClientId = process.env.GOOGLE_CLIENT_ID!;
    
    if (githubClientId.length < 20) {
      throw new Error('❌ Invalid GitHub Client ID format');
    }
    
    if (!googleClientId.includes('.apps.googleusercontent.com')) {
      console.warn('⚠️ Google Client ID should end with .apps.googleusercontent.com');
    }
  }

  private validateApiKeys(): void {
    const groqKey = process.env.GROQ_API_KEY!;
    
    if (!groqKey.startsWith('gsk_')) {
      throw new Error('❌ Invalid Groq API key format. Should start with "gsk_"');
    }
    
    if (process.env.HUGGINGFACE_TOKEN && !process.env.HUGGINGFACE_TOKEN.startsWith('hf_')) {
      console.warn('⚠️ HuggingFace token should start with "hf_"');
    }
    
    if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
      console.warn('⚠️ OpenRouter API key should start with "sk-or-"');
    }
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public validateForDeployment(): void {
    if (this.isProduction()) {
      // Additional production checks
      if (!this.config.HUGGINGFACE_TOKEN && !this.config.OPENROUTER_API_KEY) {
        console.warn('⚠️ No fallback AI providers configured. Consider adding HuggingFace or OpenRouter tokens for redundancy.');
      }
      
      if (this.config.BETTER_AUTH_URL.includes('localhost')) {
        // Only warn in Vercel deployments since VERCEL_URL might not be set during build time
        if (!process.env.VERCEL) {
          throw new Error('❌ Production environment cannot use localhost URLs');
        }
      }
      
      console.log('✅ All production environment variables validated successfully');
    }
  }
}

// Export singleton instance
export const envValidator = EnvironmentValidator.getInstance();
export const env = envValidator.getConfig();

// Validate on import in production
if (process.env.NODE_ENV === 'production') {
  envValidator.validateForDeployment();
}