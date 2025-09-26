import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <header class="admin-header">
        <div class="header-left">
          <div class="logo">🔐 Todo App - Admin Panel</div>
        </div>
        <div class="header-right">
          <span class="admin-badge">ADMIN</span>
          <span class="alerts">🚨 [5] Alerts</span>
          <span *ngIf="currentUser">{{ currentUser.fullName }}</span>
          <div class="user-avatar">{{ getUserInitials() }}</div>
          <button class="btn btn-secondary" (click)="switchToUser()">Switch to User</button>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </header>

      <div class="admin-content">
        <div class="admin-dashboard">
          <h1>Admin Dashboard</h1>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">1,247</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">892</div>
              <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">15,783</div>
              <div class="stat-label">Total Todos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">47</div>
              <div class="stat-label">System Issues</div>
            </div>
          </div>

          <div class="admin-section">
            <h2>System Health</h2>
            <div class="health-status">
              <div class="health-item">
                <span>Server Status:</span>
                <span class="status-good">Operational</span>
              </div>
              <div class="health-item">
                <span>Database:</span>
                <span class="status-good">Healthy</span>
              </div>
              <div class="health-item">
                <span>CPU Usage:</span>
                <span class="status-warning">45%</span>
              </div>
              <div class="health-item">
                <span>Memory:</span>
                <span class="status-warning">67%</span>
              </div>
            </div>
          </div>

          <div class="admin-section">
            <h2>Recent Activity</h2>
            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-user">John Doe</div>
                <div class="activity-action">Created 3 new todos</div>
                <div class="activity-time">2 minutes ago</div>
              </div>
              <div class="activity-item">
                <div class="activity-user">Sarah Miller</div>
                <div class="activity-action">Logged in</div>
                <div class="activity-time">5 minutes ago</div>
              </div>
              <div class="activity-item">
                <div class="activity-user">Mike Johnson</div>
                <div class="activity-action">Completed 5 todos</div>
                <div class="activity-time">15 minutes ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .admin-header {
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 20px;
      font-weight: bold;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 14px;
    }

    .admin-badge {
      background: #ffc107;
      color: #333;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-secondary {
      background: white;
      color: #333;
    }

    .admin-content {
      flex: 1;
      padding: 24px;
      background: #f5f5f5;
      overflow-y: auto;
    }

    .admin-dashboard h1 {
      color: #333;
      margin-bottom: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-number {
      font-size: 28px;
      font-weight: bold;
      color: #dc3545;
      margin-bottom: 8px;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .admin-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .admin-section h2 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .health-status {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .health-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .status-good {
      color: #28a745;
      font-weight: bold;
    }

    .status-warning {
      color: #ffc107;
      font-weight: bold;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .activity-user {
      font-weight: 500;
      color: #333;
    }

    .activity-action {
      color: #666;
    }

    .activity-time {
      font-size: 12px;
      color: #999;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .health-status {
        grid-template-columns: 1fr;
      }
      
      .header-right {
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const names = this.currentUser.fullName.split(' ');
      return names.map(name => name.charAt(0).toUpperCase()).slice(0, 2).join('');
    }
    return 'A';
  }

  switchToUser(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}