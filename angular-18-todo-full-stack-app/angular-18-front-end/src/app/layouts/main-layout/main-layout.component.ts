import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="main-layout">
      <header class="header">
        <div class="header-left">
          <button class="sidebar-toggle" (click)="toggleSidebar()">☰</button>
          <div class="logo">📋 Todo App</div>
        </div>
        <div class="header-right">
          <div class="notifications">
            <button class="notification-btn">🔔 <span class="badge">3</span></button>
          </div>
          <div class="user-menu" *ngIf="currentUser">
            <span class="user-greeting">Welcome, {{ currentUser.fullName.split(' ')[0] }}</span>
            <div class="user-avatar">{{ getUserInitials() }}</div>
            <div class="user-dropdown">
              <button (click)="logout()" class="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div class="content-wrapper" [class.sidebar-collapsed]="!sidebarOpen">
        <aside class="sidebar" [class.open]="sidebarOpen">
          <nav class="sidebar-nav">
            <h3>Navigation</h3>
            <ul class="nav-menu">
              <li><a routerLink="/dashboard" routerLinkActive="active">📋 My Todos</a></li>
              <li><a routerLink="/dashboard/calendar" routerLinkActive="active">📅 Calendar View</a></li>
              <li><a routerLink="/dashboard/progress" routerLinkActive="active">📈 Progress</a></li>
              <li><a routerLink="/dashboard/categories" routerLinkActive="active">🏷️ Categories</a></li>
              <li><a routerLink="/dashboard/important" routerLinkActive="active">⭐ Important</a></li>
              <li><a routerLink="/dashboard/completed" routerLinkActive="active">✅ Completed</a></li>
              <li><a routerLink="/dashboard/trash" routerLinkActive="active">🗑️ Trash</a></li>
            </ul>

            <h3>Categories</h3>
            <ul class="nav-menu categories">
              <li><a routerLink="/dashboard/category/work">💼 Work <span class="count">12</span></a></li>
              <li><a routerLink="/dashboard/category/personal">🏠 Personal <span class="count">8</span></a></li>
              <li><a routerLink="/dashboard/category/shopping">🛒 Shopping <span class="count">3</span></a></li>
              <li><a routerLink="/dashboard/category/health">❤️ Health <span class="count">2</span></a></li>
              <li><a routerLink="/dashboard/categories/new">+ Add Category</a></li>
            </ul>
          </nav>
        </aside>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      height: 60px;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .sidebar-toggle {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 5px;
    }

    .logo {
      font-size: 20px;
      font-weight: bold;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .notification-btn {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      position: relative;
    }

    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #dc3545;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    .user-greeting {
      font-size: 14px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      cursor: pointer;
    }

    .logout-btn {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #ddd;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }

    .content-wrapper {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      background: #f8f9fa;
      border-right: 1px solid #ddd;
      padding: 20px;
      overflow-y: auto;
      transition: transform 0.3s ease;
    }

    .sidebar-nav h3 {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      margin: 20px 0 10px 0;
      font-weight: 600;
    }

    .nav-menu {
      list-style: none;
      padding: 0;
      margin: 0 0 30px 0;
    }

    .nav-menu li {
      margin: 4px 0;
    }

    .nav-menu a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      text-decoration: none;
      color: #555;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .nav-menu a:hover {
      background: #e9ecef;
      color: #333;
    }

    .nav-menu a.active {
      background: #007bff;
      color: white;
    }

    .count {
      font-size: 12px;
      background: #ddd;
      color: #666;
      padding: 2px 6px;
      border-radius: 10px;
    }

    .nav-menu a.active .count {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background: #f5f5f5;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        top: 60px;
        left: 0;
        height: calc(100vh - 60px);
        transform: translateX(-100%);
        z-index: 999;
        box-shadow: 2px 0 5px rgba(0,0,0,0.1);
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .content-wrapper.sidebar-collapsed .main-content {
        margin-left: 0;
      }

      .user-greeting {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  sidebarOpen = true;
  private subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const names = this.currentUser.fullName.split(' ');
      return names.map(name => name.charAt(0).toUpperCase()).slice(0, 2).join('');
    }
    return 'U';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}