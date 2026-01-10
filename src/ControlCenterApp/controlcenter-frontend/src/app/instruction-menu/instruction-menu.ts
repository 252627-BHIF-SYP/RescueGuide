import { Component } from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatChip, MatChipListbox} from '@angular/material/chips';
import {MatDivider} from '@angular/material/divider';
import {MatList, MatListItem} from '@angular/material/list';
import {MatButton} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {Navbar} from '../navbar/navbar';

@Component({
  selector: 'app-instruction-menu',
  imports: [
    MatToolbar,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatChip,
    MatDivider,
    MatList,
    MatListItem,
    MatButton,
    MatCardTitle,
    MatChip,
    MatChipsModule,
    MatList,
    Navbar
  ],
  templateUrl: './instruction-menu.html',
  styleUrl: './instruction-menu.scss',
})
export class InstructionMenu {

}
