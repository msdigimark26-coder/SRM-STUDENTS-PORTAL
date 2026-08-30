import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ConnectionState, NormalizedStudentData } from '@srm/shared';
import { AuthenticationDetector } from './AuthenticationDetector';

const LOGIN_URL = 'https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp';

export class PlaywrightSessionManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  
  private currentState: ConnectionState = 'DISCONNECTED';
  private detector: AuthenticationDetector;
  private activeData: NormalizedStudentData | null = null;
  
  constructor() {
    this.detector = new AuthenticationDetector();
  }

  public getState(): ConnectionState {
    return this.currentState;
  }

  public getData(): NormalizedStudentData | null {
    return this.activeData;
  }

  private setState(state: ConnectionState) {
    this.currentState = state;
  }

  public async connect(): Promise<void> {
    if (this.currentState !== 'DISCONNECTED') {
      return;
    }

    try {
      this.setState('LAUNCHING');

      this.browser = await chromium.launch({
        headless: false, // Visible browser for manual authentication
        args: ['--no-sandbox']
      });

      this.context = await this.browser.newContext({
        // Do not persist state to disk
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      });

      // Evasion for bot telemetry scripts that cause "Invalid credentials"
      await this.context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        (window as any).chrome = { runtime: {} };
      });

      this.page = await this.context.newPage();

      // Handle unexpected closure
      this.page.on('close', () => {
        this.cleanup();
      });

      await this.page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

      // Expose a diagnostic state variable for debugging
      console.log(`[Diagnostic] Session started. URL: ${this.page.url()}`);

      this.setState('WAITING_FOR_LOGIN');

      // Wait for user to authenticate (10 minute timeout for manual entry + CAPTCHA)
      const finalState = await this.detector.monitorAuthentication(
        this.page, 
        600000, 
        (state) => {
          this.setState(state);
          console.log(`[Diagnostic] Auth State changed: ${state}`);
        }
      );

      if (finalState === 'AUTHENTICATED') {
        this.setState('AUTHENTICATED');
        console.log(`[Diagnostic] Authentication successful. Final URL: ${this.page?.url()}`);
        
        // Phase 5B Extraction
        try {
          const { SRMISTPortalAdapter } = require('./SRMISTPortalAdapter');
          const adapter = new SRMISTPortalAdapter();
          const data = await adapter.extractData(this.page);
          
          if (data) {
             this.activeData = data;
             this.setState('DATA_READY');
             console.log(`[Diagnostic] Data extraction successful. State -> DATA_READY`);
          } else {
             this.setState('ERROR');
          }
        } catch (e) {
          console.error('Failed to extract data:', e);
          this.setState('ERROR');
        }

      } else {
        // TIMEOUT or page closed
        if (this.getState() !== 'LOGIN_FAILED') {
           this.setState('TIMEOUT');
        }
        console.log(`[Diagnostic] Authentication ended without success. Final State: ${this.currentState}`);
        await this.cleanup();
      }

    } catch (error) {
      console.error('Playwright launch/connection error:', error);
      this.setState('ERROR');
      await this.cleanup();
    }
  }

  public async disconnect(): Promise<void> {
    this.setState('DISCONNECTING');
    await this.cleanup();
  }

  public async cleanup(): Promise<void> {
    try {
      this.activeData = null; // Clear data on cleanup
      if (this.page && !this.page.isClosed()) {
        await this.page.close().catch(() => {});
      }
      this.page = null;

      if (this.context) {
        await this.context.close().catch(() => {});
      }
      this.context = null;

      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
      this.browser = null;

    } catch (error) {
      console.error('Error during Playwright cleanup:', error);
    } finally {
      this.setState('DISCONNECTED');
    }
  }
}

// Singleton instance
export const sessionManager = new PlaywrightSessionManager();
