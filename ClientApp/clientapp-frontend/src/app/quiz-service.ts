
import { Injectable, signal } from '@angular/core';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizResult {
  questionId: number;
  selectedAnswer: string;
  correct: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  questions = signal<QuizQuestion[]>([
    { id: 1, question: 'Was ist die Notrufnummer in Deutschland?', options: ['911', '110', '112', '999'], correctAnswer: '112' },
    { id: 2, question: 'Wie behandelt man eine Verbrennung?', options: ['Kühlen', 'Reiben', 'Heiße Kleidung drauf', 'Abdecken mit Eis'], correctAnswer: 'Kühlen' },
    { id: 3, question: 'Wie überprüft man die Atmung?', options: ['Nur Puls fühlen', 'Sehen, Hören, Fühlen', 'Schütteln', 'Wegrennen'], correctAnswer: 'Sehen, Hören, Fühlen' },
    { id: 4, question: 'Was macht man bei einer Schnittwunde?', options: ['Ignorieren', 'Reinigen und verbinden', 'Heiße Flüssigkeit drauf', 'Drücken'], correctAnswer: 'Reinigen und verbinden' },
    { id: 5, question: 'Wann stabile Seitenlage?', options: ['Bewusstlos, aber atmet', 'Schläft', 'Kopfschmerzen', 'Hustet'], correctAnswer: 'Bewusstlos, aber atmet' },
    { id: 6, question: 'Was tun bei Herzstillstand?', options: ['Herzdruckmassage', 'Trinken geben', 'Schütteln', 'Wegrennen'], correctAnswer: 'Herzdruckmassage' },
    { id: 7, question: 'Wie Infektion verhindern?', options: ['Nicht anfassen', 'Wunde reinigen & verbinden', 'Nur Hände waschen', 'Mit Feuer desinfizieren'], correctAnswer: 'Wunde reinigen & verbinden' },
    { id: 8, question: 'Allergische Reaktion Insektenstich?', options: ['Nichts', 'Kühlen', 'Notruf rufen', 'Schütteln'], correctAnswer: 'Notruf rufen' },
    { id: 9, question: 'Wie bei Nasenbluten?', options: ['Kopf nach hinten', 'Kopf nach vorne + Druck', 'Liegestütz', 'Druck auf Ohr'], correctAnswer: 'Kopf nach vorne + Druck' },
    { id: 10, question: 'Wann Notarzt rufen?', options: ['Leichte Kopfschmerzen', 'Lebensgefahr', 'Husten', 'Schnupfen'], correctAnswer: 'Lebensgefahr' },
  ]);

  results = signal<QuizResult[]>([]);

  saveAnswer(questionId: number, answer: string) {
    const question = this.questions().find(q => q.id === questionId);
    if (!question) return;

    const correct = question.correctAnswer === answer;

    const existing = this.results().find(r => r.questionId === questionId);
    if (existing) {
      existing.selectedAnswer = answer;
      existing.correct = correct;
      this.results.set([...this.results()]);
    } else {
      this.results.set([...this.results(), { questionId, selectedAnswer: answer, correct }]);
    }
  }

  resetQuiz() {
    this.results.set([]);
  }
}
