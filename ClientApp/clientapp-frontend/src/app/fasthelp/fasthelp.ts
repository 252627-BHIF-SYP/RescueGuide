import { Component, signal, computed } from '@angular/core';
import { OnInit, inject } from '@angular/core';
import { FirstHelpService, FirstHelp } from './firsthelp.service';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {Navbar} from '../navbar/navbar';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';



@Component({
  selector: 'app-fasthelp',
  templateUrl: 'fasthelp.html',
  styleUrls: ['./fasthelp.scss'],
  imports: [
    MatCard,
    MatCardHeader,
    MatIconButton,
    MatIcon,
    MatCardContent,
    MatButton,
    MatCardTitle,
    RouterLink,
    Navbar,
    FormsModule,
    MatFormField,
    MatInput
  ],
  standalone: true
})
export class FastHelpComponent implements OnInit {
  topics = signal<FirstHelp[]>([]);

  query = signal('');

  filteredTopics = computed(() => {
    const q = this.query().toLowerCase();
    const all = this.topics();
    if (!q) return all;
    return all.filter(t => t.name.toLowerCase().includes(q));
  });

  selectedTopic = signal<FirstHelp | null>(null);

  openTopic(id: number) {
    const topic = this.topics().find(t => t.id === id) ?? null;
    this.selectedTopic.set(topic);
  }

  goBack() {
    this.selectedTopic.set(null);
  }

  callEmergency() {
    alert('Notruf wird gewählt!');
  }

  private firstHelpService = inject(FirstHelpService);

  ngOnInit(): void {
    this.firstHelpService.getAll().subscribe({
      next: (data) => {
        this.topics.set(data);
      },
      error: (err) => {
        console.error('Fehler beim Laden der FirstHelp-Daten', err);
      }
    });
  }
}
