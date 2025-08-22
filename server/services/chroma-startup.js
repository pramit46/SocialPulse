import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * Auto-start ChromaDB service
 * Ensures ChromaDB is running before the main application starts
 */
class ChromaDBStartup {
  constructor() {
    this.chromaProcess = null;
    this.isStarting = false;
    this.isRunning = false;
    this.chromaPath = path.join(process.cwd(), 'shared', 'chroma-db');
  }

  async start() {
    if (this.isRunning || this.isStarting) {
      console.log('🔍 ChromaDB already starting/running');
      return true;
    }

    try {
      console.log('🚀 Starting ChromaDB server...');
      this.isStarting = true;

      // Ensure ChromaDB directory exists
      if (!existsSync(this.chromaPath)) {
        mkdirSync(this.chromaPath, { recursive: true });
        console.log(`📁 Created ChromaDB directory: ${this.chromaPath}`);
      }

      // Start ChromaDB process
      this.chromaProcess = spawn('chroma', ['run', '--path', this.chromaPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      // Handle ChromaDB process events
      this.chromaProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Running on')) {
          console.log('✅ ChromaDB server started successfully');
          this.isRunning = true;
          this.isStarting = false;
        }
        // Log ChromaDB output for debugging
        console.log(`[ChromaDB] ${output.trim()}`);
      });

      this.chromaProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        console.warn(`[ChromaDB Error] ${error.trim()}`);
      });

      this.chromaProcess.on('error', (error) => {
        console.error('❌ ChromaDB process error:', error.message);
        this.isRunning = false;
        this.isStarting = false;
        
        if (error.code === 'ENOENT') {
          console.warn('⚠️ ChromaDB command not found. Install with: pip install chromadb');
        }
      });

      this.chromaProcess.on('exit', (code, signal) => {
        console.log(`📊 ChromaDB process exited with code ${code}, signal ${signal}`);
        this.isRunning = false;
        this.isStarting = false;
      });

      // Wait for ChromaDB to fully start
      await this.waitForStart();
      return this.isRunning;

    } catch (error) {
      console.error('❌ Failed to start ChromaDB:', error.message);
      this.isStarting = false;
      return false;
    }
  }

  async waitForStart(timeout = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkStatus = () => {
        if (this.isRunning) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          console.warn('⚠️ ChromaDB startup timeout, continuing without it');
          resolve(false);
          return;
        }
        
        setTimeout(checkStatus, 500);
      };
      
      checkStatus();
    });
  }

  async stop() {
    if (this.chromaProcess && !this.chromaProcess.killed) {
      console.log('🛑 Stopping ChromaDB server...');
      this.chromaProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if needed
      setTimeout(() => {
        if (this.chromaProcess && !this.chromaProcess.killed) {
          this.chromaProcess.kill('SIGKILL');
        }
      }, 5000);
    }
    
    this.isRunning = false;
    this.isStarting = false;
  }

  isChromaRunning() {
    return this.isRunning;
  }
}

// Singleton instance
const chromaStartup = new ChromaDBStartup();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await chromaStartup.stop();
});

process.on('SIGINT', async () => {
  await chromaStartup.stop();
  process.exit(0);
});

export default chromaStartup;