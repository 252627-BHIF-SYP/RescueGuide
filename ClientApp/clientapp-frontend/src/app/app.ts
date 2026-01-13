import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatList, MatListItem } from '@angular/material/list';
import {Navbar} from './navbar/navbar';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatButton,
    MatList,
    MatListItem,
    Navbar,
    RouterOutlet
  ]
})
export class App {
}
