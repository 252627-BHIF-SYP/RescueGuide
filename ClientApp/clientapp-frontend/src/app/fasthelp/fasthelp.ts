import { Component, signal } from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {Navbar} from '../navbar/navbar';

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
    Navbar
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
