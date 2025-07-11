// src/modules/admin/controllers/admin-static.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('admin')
export class AdminStaticController {
  @Get()
  serveAdminDashboard(@Res() res: Response) {
    // Path to the admin dashboard HTML file
    const htmlPath = join(process.cwd(), 'public', 'admin', 'index.html');
    
    // Check if file exists
    if (existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      // If file doesn't exist, send a simple HTML response
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Noot Admin Dashboard</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 2rem;
              border-radius: 15px;
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; }
            p { margin-bottom: 2rem; }
            .api-list {
              text-align: left;
              background: rgba(255,255,255,0.1);
              padding: 1rem;
              border-radius: 10px;
              margin-top: 2rem;
            }
            .api-list h3 { margin-top: 0; }
            .api-list ul { margin: 0; padding-left: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎵 Noot Admin Dashboard</h1>
            <p>Admin dashboard is running! Create <code>public/admin/index.html</code> for the full interface.</p>
            
            <div class="api-list">
              <h3>Available Admin API Endpoints:</h3>
              <ul>
                <li><strong>POST</strong> /admin/auth/login - Admin login</li>
                <li><strong>GET</strong> /admin/auth/profile - Get admin profile</li>
                <li><strong>GET</strong> /admin/dashboard - Dashboard data</li>
                <li><strong>GET</strong> /admin/users - User management</li>
                <li><strong>GET</strong> /admin/posts - Content moderation</li>
                <li><strong>GET</strong> /admin/reports - Report management</li>
                <li><strong>GET</strong> /admin/fanbases - Fanbase management</li>
                <li><strong>GET</strong> /admin/metrics/* - Analytics</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  }
}