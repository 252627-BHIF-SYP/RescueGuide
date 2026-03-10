import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { QuizQuestion, QuizService, Quiz } from '../quiz-service';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-quiz',
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    RouterLink,
    Navbar
  ],
  templateUrl: 'quiz.html',
  styleUrl: 'quiz.scss',
})
export class QuizComponent implements OnInit {
  public quizService = inject(QuizService);

  searchTerm = signal('');
  currentIndex = signal(0);

  filteredQuizzes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.quizService.quizzes();
    }
    return this.quizService.quizzes().filter(quiz =>
      quiz.title.toLowerCase().includes(term) ||
      quiz.description.toLowerCase().includes(term)
    );
  });

  currentQuestion = computed(() => {
    const questions = this.quizService.questions();
    const index = this.currentIndex();

    if (questions.length === 0) {
      return { options: [], id: 0, question: '', correctAnswer: '' };
    }

    if (index >= 0 && index < questions.length) {
      return questions[index];
    }

    return { options: [], id: 0, question: '', correctAnswer: '' };
  });

  correctCount = computed(() => {
    const results = this.quizService.results();
    return results.filter(r => r.correct).length;
  });

  ngOnInit() {
    this.quizService.resetQuiz();
    this.currentIndex.set(0);
  }

  selectQuiz(quizId: number) {
    this.quizService.selectQuiz(quizId);
    this.currentIndex.set(0);
  }

  backToSelection() {
    this.quizService.selectedQuiz.set(null);
    this.quizService.questions.set([]);
    this.quizService.resetQuiz();
    this.currentIndex.set(0);
  }

  onSearchChange() {
    // Trigger recomputation of filteredQuizzes
  }

  selectAnswer(option: string) {
    const currentQ = this.currentQuestion();

    if (!currentQ || currentQ.id === 0) {
      console.error('Keine gültige Frage gefunden');
      return;
    }

    this.quizService.saveAnswer(currentQ.id, option);

    if (this.currentIndex() < this.quizService.questions().length - 1) {
      this.currentIndex.update(idx => idx + 1);
    } else {
      this.currentIndex.set(this.quizService.questions().length);
      this.quizService.completeQuiz();
    }
  }

  restartQuiz() {
    this.quizService.resetQuiz();
    this.currentIndex.set(0);
  }

  getCorrectAnswer(questionId: number): string {
    const question = this.quizService.questions().find(q => q.id === questionId);
    return question?.correctAnswer || 'Nicht verfügbar';
  }

  getScorePercentage(): number {
    const total = this.quizService.questions().length;
    const correct = this.correctCount();

    if (total === 0) return 0;

    return Math.round((correct / total) * 100);
  }

  isQuizFinished(): boolean {
    return this.currentIndex() >= this.quizService.questions().length;
  }
}
