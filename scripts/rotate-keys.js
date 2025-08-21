#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function rotateKeys() {
  try {
    // Read current .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf8');
    
    // Backup current .env.local
    const backupPath = path.join(process.cwd(), '.env.local.backup');
    await fs.writeFile(backupPath, envContent);
    
    console.log('Environment file backed up to .env.local.backup');
    
    // Run key rotation
    const { keyRotationService } = require('../lib/key-rotation');
    await keyRotationService.checkRotationNeeds();
    
    console.log('Key rotation check completed');
    console.log('Remember to update your production environment variables if keys were rotated');
    
  } catch (error) {
    console.error('Error during key rotation:', error);
    process.exit(1);
  }
}

// Run the rotation
rotateKeys();
