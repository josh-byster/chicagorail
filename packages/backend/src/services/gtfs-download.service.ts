/**
 * GTFS Download Service
 *
 * Handles downloading and extracting GTFS ZIP files from Metra's API.
 *
 * Single Responsibility: File download and extraction
 */

import { env } from '../config/env.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as logger from '../utils/logger.utils.js';

/**
 * Fetch the published timestamp from Metra
 * Returns null if published URL is not configured
 */
export const fetchPublishedTimestamp = async (): Promise<string | null> => {
  if (!env.GTFS_STATIC_PUBLISHED_URL) {
    logger.debug('Published timestamp URL not configured, skipping check');
    return null;
  }

  try {
    const response = await fetch(env.GTFS_STATIC_PUBLISHED_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch published timestamp: ${response.status} ${response.statusText}`
      );
    }
    const timestamp = (await response.text()).trim();
    logger.debug(`Latest published timestamp: ${timestamp}`);
    return timestamp;
  } catch (error) {
    logger.error('Failed to fetch published timestamp:', error);
    throw error;
  }
};

/**
 * Download GTFS ZIP file from Metra
 */
export const downloadGTFSZip = async (): Promise<Buffer> => {
  logger.debug(`Downloading from ${env.GTFS_STATIC_SCHEDULE_URL}...`);

  const response = await fetch(env.GTFS_STATIC_SCHEDULE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download GTFS ZIP: ${response.status} ${response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();
  const zipBuffer = Buffer.from(buffer);

  logger.debug(`Downloaded ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  return zipBuffer;
};

/**
 * Extract ZIP file to temporary directory
 */
export const extractZipToTemp = (zipBuffer: Buffer): string => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtfs-'));
  logger.debug(`Extracting to ${tempDir}...`);

  const zip = new AdmZip(zipBuffer);
  zip.extractAllTo(tempDir, true);

  const files = fs.readdirSync(tempDir);
  logger.debug(`Extracted ${files.length} files`);

  return tempDir;
};

/**
 * Clean up temporary directory
 */
export const cleanupTempDir = (tempDir: string): void => {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    logger.debug('Cleaned up temporary directory');
  } catch (error) {
    logger.warn(`Failed to cleanup temp directory: ${error}`);
  }
};
