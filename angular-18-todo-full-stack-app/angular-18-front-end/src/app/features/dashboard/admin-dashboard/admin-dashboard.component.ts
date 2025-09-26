import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div class="admin-stats">
        <div class="admin-stat-card">
          <h3>Total Users</h3>
          <span class="stat-number">5</span>
        </div>
        <div class="admin-stat-card">
          <h3>Active Users</h3>
          <span class="stat-number">4</span>
        </div>
        <div class="admin-stat-card">
          <h3>Total Todos</h3>
          <span class="stat-number">15</span>
        </div>
        <div class="admin-stat-card">
          <h3>System Health</h3>
          <span class="health-indicator healthy">Good</span>
        </div>
      </div>
      <div class="recent-activity">
        <h3>Recent Activity</h3>
        <div class="activity-item">
          <span class="activity-icon">👤</span>
          <span class="activity-text">User registered</span>
          <span class="activity-time">2 mins ago</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
    }
    .admin-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .admin-stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #007bff;
    }
    .health-indicator.healthy {
      color: #28a745;
      font-weight: bold;
    }
    .activity-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
  `]
})
export class AdminDashboardComponent {
  constructor() {}
}