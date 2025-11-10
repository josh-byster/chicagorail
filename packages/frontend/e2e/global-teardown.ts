/* eslint-disable no-console */
import { FullConfig } from '@playwright/test';

export default async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');

  // Kill backend process
  const backendPid = process.env.BACKEND_PID;
  if (backendPid) {
    try {
      process.kill(Number(backendPid), 'SIGTERM');
      console.log('✅ Backend server stopped');

      // Wait a bit for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Force kill if still running
      try {
        process.kill(Number(backendPid), 0); // Check if process exists
        process.kill(Number(backendPid), 'SIGKILL');
        console.log('⚠️  Backend server force killed');
      } catch {
        // Process already terminated
      }
    } catch (error) {
      console.error('❌ Failed to stop backend:', error);
    }
  }

  console.log('👋 Teardown complete');
}
