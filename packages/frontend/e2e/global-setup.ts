/* eslint-disable no-console */
import { chromium, FullConfig } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendProcess: ChildProcess | null = null;

export default async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting test environment setup...');

  // 1. Setup test database path
  const backendDir = path.join(__dirname, '../../../backend');
  const testDbPath = path.join(backendDir, 'data/gtfs.test.db');
  const testDbDir = path.dirname(testDbPath);

  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }

  // 2. Load test environment variables
  const envTestPath = path.join(__dirname, '../../../.env.test');
  console.log(`📝 Loading test environment from ${envTestPath}`);

  // 3. Check if test DB exists, if not import GTFS data
  if (!fs.existsSync(testDbPath)) {
    console.log('📦 Test database not found, importing GTFS data...');
    console.log('⏳ This may take 1-2 minutes on first run...');

    // Set environment variables for the import
    // Note: We omit realtime URLs since they're optional and empty strings fail validation
    const testEnv = {
      ...process.env,
      DATABASE_PATH: testDbPath,
      NODE_ENV: 'test',
      GTFS_STATIC_SCHEDULE_URL:
        'https://schedules.metrarail.com/gtfs/schedule.zip',
    };

    // Run import script using the existing gtfs:import script
    const importProcess = spawn(
      'pnpm',
      ['--filter', 'backend', 'gtfs:import'],
      {
        cwd: path.join(backendDir, '../..'), // Run from monorepo root
        env: testEnv,
        stdio: 'pipe',
      }
    );

    let importOutput = '';
    importProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      importOutput += output;
      if (!process.env.CI) {
        process.stdout.write(output);
      }
    });

    importProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      importOutput += output;
      if (!process.env.CI) {
        process.stderr.write(output);
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        importProcess.kill();
        reject(new Error('GTFS import timed out after 5 minutes'));
      }, 300000); // 5 minute timeout

      importProcess.on('exit', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          console.log('✅ GTFS data imported successfully');
          resolve();
        } else {
          console.error('❌ Import process failed with code:', code);
          console.error('Last 500 chars of output:', importOutput.slice(-500));
          reject(new Error(`GTFS import failed with code ${code}`));
        }
      });

      importProcess.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Failed to spawn import process:', error);
        reject(error);
      });
    });
  } else {
    console.log('✅ Test database already exists');
  }

  // 4. Start backend server
  console.log('🔧 Starting backend server on port 3001...');

  backendProcess = spawn('pnpm', ['dev'], {
    cwd: backendDir,
    env: {
      ...process.env,
      DATABASE_PATH: testDbPath,
      PORT: '3001',
      NODE_ENV: 'test',
      GTFS_STATIC_SCHEDULE_URL:
        'https://schedules.metrarail.com/gtfs/schedule.zip',
      CORS_ORIGIN: '*',
      // Omit realtime URLs - they're optional and tests don't need them
    },
    stdio: 'pipe',
  });

  // Capture backend output for debugging
  let backendOutput = '';
  let backendErrors = '';

  backendProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    backendOutput += output;
    if (!process.env.CI) {
      process.stdout.write(`[Backend] ${output}`);
    }
  });

  backendProcess.stderr?.on('data', (data) => {
    const output = data.toString();
    backendErrors += output;
    if (!process.env.CI) {
      process.stderr.write(`[Backend Error] ${output}`);
    }
  });

  // Check if backend process exited immediately
  let processExited = false;
  backendProcess!.on('exit', (code) => {
    processExited = true;
    console.error(`❌ Backend process exited unexpectedly with code ${code}`);
    if (backendErrors) {
      console.error('Last stderr output:', backendErrors.slice(-500));
    }
  });

  // 5. Wait for backend health check (with polling)
  console.log('🏥 Waiting for backend to be ready...');

  // Give the server a moment to initialize before polling
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Check if process exited during initialization
  if (processExited) {
    throw new Error('Backend process exited during initialization');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  let healthCheckPassed = false;
  let lastError: Error | null = null;

  for (let i = 0; i < 30; i++) {
    if (processExited) {
      break;
    }

    try {
      const response = await page.goto('http://localhost:3001/api/health', {
        timeout: 2000,
      });
      if (response?.ok()) {
        healthCheckPassed = true;
        console.log('✅ Backend server is ready');
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue retrying
    }
    await page.waitForTimeout(1000);
  }

  await browser.close();

  if (!healthCheckPassed) {
    console.error('=== Backend Startup Debug Info ===');
    console.error('Last 1000 chars of stdout:', backendOutput.slice(-1000));
    console.error('Last 1000 chars of stderr:', backendErrors.slice(-1000));

    const errorMsg = processExited
      ? 'Backend process exited unexpectedly'
      : `Backend health check failed after 30 attempts${lastError ? `: ${lastError.message}` : ''}`;
    throw new Error(errorMsg);
  }

  // Store backend PID for cleanup
  if (backendProcess.pid) {
    process.env.BACKEND_PID = backendProcess.pid.toString();
    console.log(`📌 Backend PID: ${backendProcess.pid}`);
  }

  console.log('🎉 Test environment ready!');
}
