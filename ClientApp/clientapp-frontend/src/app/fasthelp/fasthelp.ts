import { Component, signal, computed } from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {Navbar} from '../navbar/navbar';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

interface Topic {
  id: number;
  title: string;
  image?: string;
  instructions?: string;
}

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
export class FastHelpComponent {
  topics: Topic[] = [
    { id: 1, title: 'Verbrennungen', image: 'assets/verbrennungen.jpg', instructions: 'Sofort kühlen: Betroffene Stelle unter fließendes Wasser (ca. 20°C) halten (10-15 Min.)' },
    { id: 2, title: 'Brüche', instructions: 'Ruhigstellen, Notruf bei starken Schmerzen.' },
    { id: 3, title: 'Prellungen', instructions: 'Kühlen, hochlagern, Schonung.' },
    { id: 4, title: 'Schnitte', instructions: 'Reinigen, verbinden, Blutstillung.' },
    { id: 5, title: 'Wiederbelebung', instructions: 'Herzdruckmassage und Beatmung gemäß Anleitung.' },
    { id: 6, title: 'Vergiftung', instructions: 'Gift identifizieren, Notruf absetzen, kein Erbrechen erzwingen.' }
  ];

  query = signal('');

  filteredTopics = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.topics;
    return this.topics.filter(t => t.title.toLowerCase().includes(q));
  });

  selectedTopic = signal<Topic | null>(null);

  openTopic(id: number) {
    const topic = this.topics.find(t => t.id === id) ?? null;
    this.selectedTopic.set(topic);
  }

  goBack() {
    this.selectedTopic.set(null);
  }

  callEmergency() {
    alert('Notruf wird gewählt!');
  }
}
