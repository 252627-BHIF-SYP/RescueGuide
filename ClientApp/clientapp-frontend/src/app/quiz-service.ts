
import { Injectable, signal } from '@angular/core';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  questionId: number;
  selectedAnswer: string;
  correct: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  quizzes = signal<Quiz[]>([
    {
      id: 1,
      title: 'Erste Hilfe Grundlagen',
      description: 'Grundlegende Kenntnisse über Erste Hilfe',
      questions: [
        { id: 1, question: 'Was ist die Notrufnummer in Deutschland?', options: ['911', '110', '112', '999'], correctAnswer: '112' },
        { id: 2, question: 'Wie behandelt man eine Verbrennung?', options: ['Kühlen', 'Reiben', 'Heiße Kleidung drauf', 'Abdecken mit Eis'], correctAnswer: 'Kühlen' },
        { id: 3, question: 'Wie überprüft man die Atmung?', options: ['Nur Puls fühlen', 'Sehen, Hören, Fühlen', 'Schütteln', 'Wegrennen'], correctAnswer: 'Sehen, Hören, Fühlen' },
        { id: 4, question: 'Was macht man bei einer Schnittwunde?', options: ['Ignorieren', 'Reinigen und verbinden', 'Heiße Flüssigkeit drauf', 'Drücken'], correctAnswer: 'Reinigen und verbinden' },
        { id: 5, question: 'Wann stabile Seitenlage?', options: ['Bewusstlos, aber atmet', 'Schläft', 'Kopfschmerzen', 'Hustet'], correctAnswer: 'Bewusstlos, aber atmet' },
      ]
    },
    {
      id: 2,
      title: 'Erweiterte Erste Hilfe',
      description: 'Fortgeschrittene Techniken und Szenarien',
      questions: [
        { id: 6, question: 'Was tun bei Herzstillstand?', options: ['Herzdruckmassage', 'Trinken geben', 'Schütteln', 'Wegrennen'], correctAnswer: 'Herzdruckmassage' },
        { id: 7, question: 'Wie Infektion verhindern?', options: ['Nicht anfassen', 'Wunde reinigen & verbinden', 'Nur Hände waschen', 'Mit Feuer desinfizieren'], correctAnswer: 'Wunde reinigen & verbinden' },
        { id: 8, question: 'Allergische Reaktion Insektenstich?', options: ['Nichts', 'Kühlen', 'Notruf rufen', 'Schütteln'], correctAnswer: 'Notruf rufen' },
        { id: 9, question: 'Wie bei Nasenbluten?', options: ['Kopf nach hinten', 'Kopf nach vorne + Druck', 'Liegestütz', 'Druck auf Ohr'], correctAnswer: 'Kopf nach vorne + Druck' },
        { id: 10, question: 'Wann Notarzt rufen?', options: ['Leichte Kopfschmerzen', 'Lebensgefahr', 'Husten', 'Schnupfen'], correctAnswer: 'Lebensgefahr' },
      ]
    },
    {
      id: 3,
      title: 'Notfall-Situationen',
      description: 'Spezielle Notfälle und deren Behandlung',
      questions: [
        { id: 11, question: 'Was bei Epilepsie-Anfall?', options: ['Festhalten', 'Nichts tun, schützen', 'Wasser geben', 'Schütteln'], correctAnswer: 'Nichts tun, schützen' },
        { id: 12, question: 'Wie bei Vergiftung?', options: ['Erbrechen auslösen', 'Viel trinken', 'Giftinfo einholen', 'Schlafen'], correctAnswer: 'Giftinfo einholen' },
        { id: 13, question: 'Was bei Unterkühlung?', options: ['Heiße Dusche', 'Langsam aufwärmen', 'Kalt lassen', 'Reiben'], correctAnswer: 'Langsam aufwärmen' },
        { id: 14, question: 'Wie bei Knochenbruch?', options: ['Bewegen', 'Ruhigstellen', 'Heiß baden', 'Drücken'], correctAnswer: 'Ruhigstellen' },
        { id: 15, question: 'Was bei Schock?', options: ['Aufstehen lassen', 'Flach legen, wärmen', 'Kalt duschen', 'Laufen'], correctAnswer: 'Flach legen, wärmen' },
      ]
    }
  ]);

  selectedQuiz = signal<Quiz | null>(null);
  questions = signal<QuizQuestion[]>([]);
  results = signal<QuizResult[]>([]);

  selectQuiz(quizId: number) {
    const quiz = this.quizzes().find(q => q.id === quizId);
    if (quiz) {
      this.selectedQuiz.set(quiz);
      this.questions.set(quiz.questions);
      this.results.set([]);
    }
  }

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

  getSelectedQuiz() {
    return this.selectedQuiz();
  }
}
