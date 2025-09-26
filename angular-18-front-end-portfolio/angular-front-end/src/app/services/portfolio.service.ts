import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: {
    timestamp: string;
    version: string;
    responseTime?: string;
  };
}

export interface Profile {
  id: number;
  name: string;
  title: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  highlights: string[];
  socialLinks: {
    linkedin: string;
    github: string;
    twitter: string;
    website: string;
  };
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: Array<{
    name: string;
    level: number;
    experience: string;
    certified: boolean;
  }>;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  status: string;
  featured: boolean;
  demoUrl?: string;
  githubUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly baseUrl = 'http://localhost:3001/api/v1';

  constructor(private http: HttpClient) {}

  // Profile endpoints
  getProfile(): Observable<Profile> {
    return this.http.get<ApiResponse<Profile>>(`${this.baseUrl}/profile`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Experience endpoints
  getExperience(): Observable<Experience[]> {
    return this.http.get<ApiResponse<Experience[]>>(`${this.baseUrl}/experience`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getExperienceById(id: string): Observable<Experience> {
    return this.http.get<ApiResponse<Experience>>(`${this.baseUrl}/experience/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Skills endpoints
  getSkills(): Observable<SkillCategory[]> {
    return this.http.get<ApiResponse<SkillCategory[]>>(`${this.baseUrl}/skills`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Projects endpoints
  getProjects(): Observable<Project[]> {
    return this.http.get<ApiResponse<Project[]>>(`${this.baseUrl}/projects`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getFeaturedProjects(): Observable<Project[]> {
    return this.http.get<ApiResponse<Project[]>>(`${this.baseUrl}/projects?featured=true`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Health check
  checkApiHealth(): Observable<any> {
    return this.http.get<any>('http://localhost:3001/health')
      .pipe(
        catchError(this.handleError)
      );
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred while fetching data';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}