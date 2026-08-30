import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ConnectionState, NormalizedStudentData, CaptchaResponse, LoginCredentials } from '@srm/shared';
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

  public async getCaptcha(): Promise<CaptchaResponse> {
    if (this.currentState !== 'DISCONNECTED' && this.currentState !== 'ERROR' && this.currentState !== 'LOGIN_FAILED') {
      await this.cleanup();
    }

    try {
      this.setState('LAUNCHING');

      this.browser = await chromium.launch({
        headless: true, // Run headlessly for cloud support!
        args: ['--no-sandbox']
      });

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      });

      await this.context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        (window as any).chrome = { runtime: {} };
      });

      this.page = await this.context.newPage();

      this.page.on('close', () => {
        if (this.currentState !== 'DATA_READY') {
           this.cleanup();
        }
      });

      await this.page.goto(LOGIN_URL, { waitUntil: 'networkidle' });
      
      // Wait for captcha image to load
      const captchaLocator = this.page.locator('#captchaImg');
      await captchaLocator.waitFor({ state: 'visible', timeout: 15000 });
      
      // Give a tiny buffer for image to fully render pixels
      await this.page.waitForTimeout(500);

      // Take screenshot of just the CAPTCHA element
      const captchaBuffer = await captchaLocator.screenshot();
      const base64 = captchaBuffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64}`;

      this.setState('WAITING_FOR_LOGIN');

      // Generate a mock session ID (in a real app, use UUID to handle multiple concurrent sessions)
      const sessionId = 'session-' + Date.now();

      return {
        sessionId,
        captchaImageBase64: dataUri
      };

    } catch (error) {
      console.error('Failed to initialize session and get CAPTCHA:', error);
      this.setState('ERROR');
      await this.cleanup();
      throw error;
    }
  }

  public async loginAndExtract(credentials: LoginCredentials): Promise<NormalizedStudentData> {
    if (this.currentState !== 'WAITING_FOR_LOGIN' || !this.page) {
      throw new Error('No active session waiting for login. Please refresh the page.');
    }

    try {
      this.setState('AUTHENTICATED'); // Temporary while we process

      // Fill in the form
      await this.page.fill('#username', credentials.netId);
      await this.page.fill('#password', credentials.password);
      await this.page.fill('#captcha', credentials.captchaValue);

      // Trigger any JS blur events that might be attached
      await this.page.locator('#captcha').blur();
      await this.page.waitForTimeout(500);

      // Click the login button (it usually has class btn or id loginBtn/Submit)
      // Since we didn't inspect the button, we can just press Enter on the captcha field
      await this.page.locator('#captcha').press('Enter');

      console.log(`[Diagnostic] Login submitted. Waiting for auth state...`);

      // Reuse the existing detector to see if it worked
      const finalState = await this.detector.monitorAuthentication(
        this.page, 
        30000, // 30 second timeout for login
        (state) => {
          this.setState(state);
        }
      );

      if (finalState === 'AUTHENTICATED') {
        this.setState('AUTHENTICATED');
        console.log(`[Diagnostic] Login successful! Extracting data...`);
        
        const { SRMISTPortalAdapter } = require('./SRMISTPortalAdapter');
        const adapter = new SRMISTPortalAdapter();
        const data = await adapter.extractData(this.page);
        
        if (data) {
           this.activeData = data;
           this.setState('DATA_READY');
           // Keep session alive if needed, or clean it up. We clean it up after extraction to save memory.
           await this.cleanup();
           return data;
        } else {
           throw new Error('Data extraction failed');
        }

      } else {
        // It failed (either INVALID_CREDENTIALS or TIMEOUT)
        throw new Error('Login failed. Please check your NetID, password, and CAPTCHA.');
      }

    } catch (error) {
      console.error('Login process failed:', error);
      this.setState('LOGIN_FAILED');
      await this.cleanup();
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    this.setState('DISCONNECTING');
    await this.cleanup();
  }

  public async cleanup(): Promise<void> {
    try {
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

export const sessionManager = new PlaywrightSessionManager();
