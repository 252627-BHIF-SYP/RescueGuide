import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIcon, RouterLink],
  template: `
    <nav class="action-bar bottom-nav">
      <button mat-fab color="basic" aria-label="Alarm"><mat-icon>alarm</mat-icon></button>
      <button mat-fab color="basic" routerLink="/fasthelp"><mat-icon>help_outline</mat-icon></button>
      <button mat-fab color="basic" routerLink="/study"><mat-icon>book</mat-icon></button>
      <button mat-fab color="basic" routerLink="/profile"><mat-icon>account_circle</mat-icon></button>
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
    `
  ]
})
export class Navbar {}
