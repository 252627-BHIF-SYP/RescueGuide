import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIcon, MatIconButton, RouterLink],
  template: `
    <nav class="action-bar bottom-nav">
      <button mat-fab color="basic" aria-label="Alarm"><mat-icon>alarm</mat-icon></button>
      <button mat-fab color="basic" routerLink="/fasthelp"><mat-icon>help_outline</mat-icon></button>
      <button mat-fab color="basic" routerLink="/study"><mat-icon>book</mat-icon></button>
      <button mat-fab color="basic" routerLink="/profile"><mat-icon>account_circle</mat-icon></button>
    </nav>
  `,
  styles: [
    `.bottom-nav { display:flex; justify-content:space-around; padding:12px; position:sticky; bottom:0; background:transparent; }`,
    `.action-bar button { box-shadow: none; }`
  ]
})
export class Navbar {}
