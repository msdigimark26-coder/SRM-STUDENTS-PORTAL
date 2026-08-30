import { Page } from 'playwright';

export type AuthDetectionState = 'WAITING_FOR_LOGIN' | 'LOGIN_FAILED' | 'AUTHENTICATED' | 'TIMEOUT';

export class AuthenticationDetector {
  /**
   * Waits for the user to complete the login process manually.
   * Periodically checks the page state to differentiate between WAITING, FAILED, and AUTHENTICATED.
   */
  public async monitorAuthentication(
    page: Page,
    timeoutMs: number,
    onStateChange: (state: AuthDetectionState) => void
  ): Promise<AuthDetectionState> {
    
    const startTime = Date.now();
    let lastReportedState: AuthDetectionState = 'WAITING_FOR_LOGIN';

    const updateState = (newState: AuthDetectionState) => {
      if (newState !== lastReportedState) {
        lastReportedState = newState;
        onStateChange(newState);
      }
    };

    while (Date.now() - startTime < timeoutMs) {
      if (page.isClosed()) {
        return 'TIMEOUT';
      }

      try {
        const urlStr = page.url();
        const content = await page.content();

        // Check for failed login indicators
        if (content.includes('Invalid credentials') || content.includes('Invalid User Name or Password')) {
          updateState('LOGIN_FAILED');
        } else if (
          urlStr.includes('sp.srmist.edu.in') && 
          !urlStr.includes('loginManager') && 
          !urlStr.includes('LoginServlet') &&
          (urlStr.includes('/template/') || urlStr.includes('Dashboard'))
        ) {
          // Strong evidence of authentication
          updateState('AUTHENTICATED');
          return 'AUTHENTICATED';
        } else {
          // If no error message and not authenticated, we are waiting for login
          updateState('WAITING_FOR_LOGIN');
        }
        
        await page.waitForTimeout(1000); // Check every second
      } catch (e) {
        // Ignore errors during checking (like context destroyed)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    updateState('TIMEOUT');
    return 'TIMEOUT';
  }
}
