import { Component } from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatDivider, MatList, MatListItem} from '@angular/material/list';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-emergency-page',
  imports: [
    MatIcon,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatCard,
    MatCardHeader,
    MatIconButton,
    MatTooltip,
    MatCardContent,
    MatProgressBar,
    MatList,
    MatListItem,
    MatDivider,
    MatCardTitle,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
})
export class EmergencyPage {

}
