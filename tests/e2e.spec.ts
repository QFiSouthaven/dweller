import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

// Mock data to simulate LLM response
const MOCK_CODE_RESPONSE = `
Here is the extracted code:

### FILE: index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mock App</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>

### FILE: App.jsx
import React from 'react';
export default function App() {
  return <h1 className="text-2xl font-bold">Hello World</h1>;
}

### FILE: README.md
# Mock Project
Run with npm start
`;

const MOCK_GOOGLE_RESPONSE = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: MOCK_CODE_RESPONSE
          }
        ]
      }
    }
  ]
};

const MOCK_LOCAL_RESPONSE = {
  choices: [
    {
      message: {
        content: MOCK_CODE_RESPONSE
      }
    }
  ]
};

test.describe('AI Chat-to-Code Application', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Initial Load & UI Layout', () => {
    test('should display the main title and upload area', async ({ page }) => {
      await expect(page).toHaveTitle(/AI Chat-to-Code/);
      await expect(page.getByText('Recover Code from Screenshots')).toBeVisible();
      await expect(page.getByText('Upload Screenshot')).toBeVisible();
      await expect(page.getByText('Extraction Options')).toBeVisible();
    });

    test('should disable the extract button initially', async ({ page }) => {
      const button = page.getByRole('button', { name: /Extract & Run Code/i });
      await expect(button).toBeDisabled();
    });
  });

  test.describe('Settings Configuration', () => {
    test('should toggle extraction options', async ({ page }) => {
      const projectStructureBtn = page.getByRole('button', { name: 'Project Structure' });
      
      // It starts enabled (based on App.tsx default state)
      // We check for the visual indicator (the border color class or similar)
      // Since styles are dynamic classes, we check logic by clicking
      
      await projectStructureBtn.click();
      // After click, it should toggle off.
      // We can verify this by checking if the icon container has the "grayscale" class which corresponds to disabled state in the code
      // Note: This relies on implementation details in SettingsPanel.tsx
      const iconContainer = projectStructureBtn.locator('div').first();
      await expect(iconContainer).toHaveClass(/grayscale/);
      
      await projectStructureBtn.click();
      await expect(iconContainer).not.toHaveClass(/grayscale/);
    });

    test('should switch between Google and Local providers', async ({ page }) => {
      const advancedSettingsBtn = page.getByRole('button', { name: /AI Provider Configuration/i });
      await advancedSettingsBtn.click();

      const googleOption = page.getByText('Google Gemini');
      const localOption = page.getByText('Local LLM');

      // Default should be Google
      await expect(googleOption).toBeVisible();
      
      // Switch to Local
      await localOption.click();
      
      // Check if Local Inputs appear
      await expect(page.getByPlaceholder('http://localhost:1234/v1')).toBeVisible();
      await expect(page.getByPlaceholder('e.g., llava-v1.6-mistral')).toBeVisible();
    });
  });

  test.describe('Google Provider Flow', () => {
    test('should successfully extract code using Google Gemini', async ({ page }) => {
      // 1. Mock the API call
      await page.route('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GOOGLE_RESPONSE)
        });
      });

      // 2. Upload an image
      // Create a dummy image buffer
      const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      
      // Trigger hidden input upload
      await page.setInputFiles('input[type="file"]', {
        name: 'test-screenshot.png',
        mimeType: 'image/png',
        buffer
      });

      // 3. Verify upload preview appears
      await expect(page.getByAltText('Preview')).toBeVisible();
      
      // 4. Click Extract
      const extractBtn = page.getByRole('button', { name: /Extract & Run Code/i });
      await expect(extractBtn).toBeEnabled();
      await extractBtn.click();

      // 5. Verify Loading State
      await expect(page.getByText('Reconstructing Project...')).toBeVisible();

      // 6. Verify Result Display
      // Should show the ResultDisplay component
      await expect(page.getByText('3 Files Recovered')).toBeVisible();
      
      // Check sidebar items
      await expect(page.getByTitle('index.html')).toBeVisible();
      await expect(page.getByTitle('App.jsx')).toBeVisible();
      
      // Check code content visibility
      await expect(page.locator('pre').getByText('Hello World')).toBeVisible();
    });

    test('should handle Google API errors', async ({ page }) => {
      // 1. Mock Error Response
      await page.route('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Internal Server Error' } })
        });
      });

      // 2. Upload Image
      const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      await page.setInputFiles('input[type="file"]', { name: 'error-test.png', mimeType: 'image/png', buffer });

      // 3. Extract
      await page.getByRole('button', { name: /Extract & Run Code/i }).click();

      // 4. Verify Error Display
      // The ErrorDisplay component should render with specific text
      await expect(page.getByText('Provider Server Error')).toBeVisible();
      await expect(page.getByText('Retry Conversion')).toBeVisible();
    });
  });

  test.describe('Local LLM Flow', () => {
    test('should successfully extract code using Local LLM', async ({ page }) => {
      // 1. Switch to Local Provider
      await page.getByRole('button', { name: /AI Provider Configuration/i }).click();
      await page.getByText('Local LLM').click();

      // 2. Mock Local API
      await page.route('http://localhost:1234/v1/chat/completions', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_LOCAL_RESPONSE)
        });
      });

      // 3. Upload Image
      const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      await page.setInputFiles('input[type="file"]', { name: 'local-test.png', mimeType: 'image/png', buffer });

      // 4. Extract
      await page.getByRole('button', { name: /Extract & Run Code/i }).click();

      // 5. Verify Result
      await expect(page.getByText('3 Files Recovered')).toBeVisible();
      // Check for the "E2E Build Preview" text which appears in Preview mode or ensure default Code view
      await expect(page.getByText('index.html')).toBeVisible();
    });

    test('should handle Local Connection Refused', async ({ page }) => {
       // 1. Switch to Local
      await page.getByRole('button', { name: /AI Provider Configuration/i }).click();
      await page.getByText('Local LLM').click();

      // 2. Mock Connection Failure (Network Error)
      await page.route('http://localhost:1234/v1/chat/completions', async route => {
        await route.abort('connectionrefused');
      });

      // 3. Upload & Extract
      const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      await page.setInputFiles('input[type="file"]', { name: 'conn-fail.png', mimeType: 'image/png', buffer });
      await page.getByRole('button', { name: /Extract & Run Code/i }).click();

      // 4. Verify specific Local Error
      // ErrorDisplay.tsx logic: isLocalConnection matches 'fetch' or 'refused'
      await expect(page.getByText('Local Server Connection Failed')).toBeVisible();
      await expect(page.getByText('Ensure LM Studio or Ollama is running')).toBeVisible();
    });
  });
  
  test.describe('Result Display Interaction', () => {
     test('should allow downloading zip', async ({ page }) => {
        // Setup success state
        await page.route('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent*', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_GOOGLE_RESPONSE) });
        });
        
        const buffer = Buffer.from('fake', 'base64');
        await page.setInputFiles('input[type="file"]', { name: 't.png', mimeType: 'image/png', buffer });
        await page.getByRole('button', { name: /Extract/i }).click();
        
        // Wait for results
        await expect(page.getByText('3 Files Recovered')).toBeVisible();

        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        
        // Click download
        await page.getByRole('button', { name: /Download Project/i }).click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('recovered-project.zip');
     });

     test('should switch to live preview mode', async ({ page }) => {
        // Setup success state
        await page.route('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent*', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_GOOGLE_RESPONSE) });
        });
        
        const buffer = Buffer.from('fake', 'base64');
        await page.setInputFiles('input[type="file"]', { name: 't.png', mimeType: 'image/png', buffer });
        await page.getByRole('button', { name: /Extract/i }).click();
        await expect(page.getByText('3 Files Recovered')).toBeVisible();

        // Click "Live" toggle
        await page.getByRole('button', { name: /Live/i }).click();

        // Check for E2E specific headers in the preview pane
        await expect(page.getByText('E2E Build Preview')).toBeVisible();
        await expect(page.getByText('Babel • Tailwind • React 18')).toBeVisible();
        
        // Check for iframe
        await expect(page.locator('iframe')).toBeVisible();
     });
  });

});