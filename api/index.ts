import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Create Express app for serverless function
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes
let routesInitialized = false;
let initPromise: Promise<any> | null = null;

async function initializeApp() {
  if (routesInitialized) return app;
  
  if (initPromise) {
    await initPromise;
    return app;
  }
  
  initPromise = registerRoutes(app);
  await initPromise;
  routesInitialized = true;
  
  return app;
}

// Serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialize the Express app if not already done
    const expressApp = await initializeApp();
    
    // Handle the request with Express
    return new Promise((resolve, reject) => {
      // Convert Vercel request/response to Express format
      const mockReq = {
        ...req,
        url: req.url || '/',
        method: req.method || 'GET',
        headers: req.headers,
        body: req.body
      };
      
      const mockRes = {
        ...res,
        json: (data: any) => {
          res.status(200).json(data);
          resolve(data);
        },
        send: (data: any) => {
          res.send(data);
          resolve(data);
        },
        status: (code: number) => {
          res.status(code);
          return mockRes;
        },
        setHeader: (name: string, value: string) => {
          res.setHeader(name, value);
        }
      };
      
      // Use Express to handle the request
      expressApp(mockReq as any, mockRes as any, (err: any) => {
        if (err) {
          console.error('Express error:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}