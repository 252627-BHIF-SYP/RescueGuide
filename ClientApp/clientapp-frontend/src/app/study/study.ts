import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { QuizQuestion, QuizService } from '../quiz-service';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-study',
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    RouterLink
  ],
  templateUrl: 'study.html',
  styleUrl: 'study.scss',
})
export class Study implements OnInit {
  public quizService = inject(QuizService);

  currentIndex = signal(0);

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
