import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticationDetector } from '../services/AuthenticationDetector';

async function discover() {
  console.log('Starting Playwright for Discovery...');
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const detector = new AuthenticationDetector();

  console.log('Navigating to login page...');
  await page.goto('https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp', { waitUntil: 'networkidle' });

  console.log('Waiting for user to authenticate... You have 10 minutes.');
  const finalState = await detector.monitorAuthentication(page, 600000, (state) => {
    console.log(`[Diagnostic] Auth State changed: ${state}`);
  });

  if (finalState !== 'AUTHENTICATED') {
    console.log('Authentication failed or timed out.');
    await browser.close();
    process.exit(1);
  }

  console.log('Authenticated! Capturing dashboard HTML...');
  await page.waitForLoadState('networkidle');
  
  const dashboardHtml = await page.content();
  fs.writeFileSync(path.join(__dirname, 'dashboard.html'), dashboardHtml);
  
  // Extract all links to see where we can navigate
  const links = await page.$$eval('a', as => as.map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') })));
  fs.writeFileSync(path.join(__dirname, 'links.json'), JSON.stringify(links, null, 2));

  console.log('Captured dashboard HTML and links.');

  // Try to find Attendance link
  const attendanceLink = links.find(l => l.text.toLowerCase().includes('attendance') && l.href && l.href !== '#');
  if (attendanceLink && attendanceLink.href) {
    console.log(`Found attendance link: ${attendanceLink.href}. Navigating...`);
    try {
      await page.goto(attendanceLink.href.startsWith('http') ? attendanceLink.href : `https://sp.srmist.edu.in${attendanceLink.href.startsWith('/') ? '' : '/'}${attendanceLink.href}`);
      await page.waitForLoadState('networkidle');
      const attendanceHtml = await page.content();
      fs.writeFileSync(path.join(__dirname, 'attendance.html'), attendanceHtml);
      console.log('Captured attendance HTML.');
    } catch (e) {
      console.log('Failed to navigate to attendance page:', e);
    }
  }

  await browser.close();
  console.log('Discovery complete.');
}

discover().catch(console.error);
