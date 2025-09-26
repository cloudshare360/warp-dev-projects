import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

import { PortfolioService, Profile, Experience, Project } from './services/portfolio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    MatCardModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    MatToolbarModule,
    MatDividerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Portfolio API Test Dashboard';
  
  // API Status
  apiHealth: any = null;
  apiHealthLoading = false;
  apiHealthError: string | null = null;
  
  // Profile Data
  profile: Profile | null = null;
  profileLoading = false;
  profileError: string | null = null;
  
  // Experience Data
  experience: Experience[] = [];
  experienceLoading = false;
  experienceError: string | null = null;
  
  // Projects Data
  projects: Project[] = [];
  projectsLoading = false;
  projectsError: string | null = null;
  
  constructor(private portfolioService: PortfolioService) {}
  
  ngOnInit() {
    this.checkApiHealth();
    this.loadProfile();
    this.loadExperience();
    this.loadProjects();
  }
  
  checkApiHealth() {
    this.apiHealthLoading = true;
    this.apiHealthError = null;
    
    this.portfolioService.checkApiHealth().subscribe({
      next: (health) => {
        this.apiHealth = health;
        this.apiHealthLoading = false;
      },
      error: (error) => {
        this.apiHealthError = error.message;
        this.apiHealthLoading = false;
      }
    });
  }
  
  loadProfile() {
    this.profileLoading = true;
    this.profileError = null;
    
    this.portfolioService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileLoading = false;
      },
      error: (error) => {
        this.profileError = error.message;
        this.profileLoading = false;
      }
    });
  }
  
  loadExperience() {
    this.experienceLoading = true;
    this.experienceError = null;
    
    this.portfolioService.getExperience().subscribe({
      next: (experience) => {
        this.experience = experience;
        this.experienceLoading = false;
      },
      error: (error) => {
        this.experienceError = error.message;
        this.experienceLoading = false;
      }
    });
  }
  
  loadProjects() {
    this.projectsLoading = true;
    this.projectsError = null;
    
    this.portfolioService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.projectsLoading = false;
      },
      error: (error) => {
        this.projectsError = error.message;
        this.projectsLoading = false;
      }
    });
  }
  
  refreshAll() {
    this.checkApiHealth();
    this.loadProfile();
    this.loadExperience();
    this.loadProjects();
  }
}