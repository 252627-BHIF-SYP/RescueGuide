import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIcon, RouterLink, RouterLinkActive],
  template: `
    <nav class="action-bar bottom-nav">
      <button mat-fab color="basic" routerLink="/startscreen" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><mat-icon>alarm</mat-icon></button>
      <button mat-fab color="basic" routerLink="/fasthelp" routerLinkActive="active"><mat-icon>help_outline</mat-icon></button>
      <button mat-fab color="basic" routerLink="/study" routerLinkActive="active"><mat-icon>book</mat-icon></button>
      <button mat-fab color="basic" routerLink="/profile" routerLinkActive="active"><mat-icon>account_circle</mat-icon></button>
    </nav>
  `,
  styles: [
    `
    .bottom-nav {
      width: 100%;
      display: flex;
      justify-content: space-around;
      padding: 1rem;
      position: fixed;
      bottom: 0;
      left: 0;
      background: white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      border-radius: 12px 12px 0 0;
      z-index: 100;
    }
    .action-bar button {
      background: white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      mat-icon {
        color: #555;
      }
    }
    .action-bar button.active mat-icon {
      color: #d32f2f; /* highlight color */
    }
    `
  ]
})
export class Navbar {}
