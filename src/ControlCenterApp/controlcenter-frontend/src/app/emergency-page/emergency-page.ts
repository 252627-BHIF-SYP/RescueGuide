import { Component } from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIconButton} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatDivider, MatList, MatListItem} from '@angular/material/list';
import {RouterLink, RouterLinkActive} from '@angular/router';
import { VideoCall } from '../video-call/video-call';

@Component({
  selector: 'app-emergency-page',
  imports: [
    MatIcon,
    MatCard,
    MatCardHeader,
    MatIconButton,
    MatCardContent,
    MatProgressBar,
    MatList,
    MatListItem,
    MatDivider,
    MatCardTitle,
    RouterLink,
    RouterLinkActive,
    VideoCall
  ],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
})
export class EmergencyPage {

}
