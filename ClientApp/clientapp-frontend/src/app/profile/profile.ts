import {Component, inject, signal} from '@angular/core';
import {QuizService, CompletedQuiz} from '../quiz-service';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton, MatButton} from '@angular/material/button';
import {MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardSubtitle} from '@angular/material/card';
import {RouterLink} from '@angular/router';
import {DatePipe} from '@angular/common';
import {Navbar} from '../navbar/navbar';

@Component({
  selector: 'app-profile',
  imports: [
    MatIcon,
    MatIconButton,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatCardSubtitle,
    RouterLink,
    DatePipe,
    Navbar
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  public quizService = inject(QuizService);
  selectedQuizForDetails = signal<CompletedQuiz | null>(null);

  showQuizDetails(quiz: CompletedQuiz) {
    if (this.selectedQuizForDetails() === quiz) {
      this.selectedQuizForDetails.set(null);
    } else {
      this.selectedQuizForDetails.set(quiz);
    }
  }

  getScorePercentage(completedQuiz: CompletedQuiz): number {
    if (completedQuiz.totalQuestions === 0) return 0;
    return Math.round((completedQuiz.score / completedQuiz.totalQuestions) * 100);
  }

  getCorrectAnswerForHistory(quizId: number, questionId: number): string {
    const quiz = this.quizService.quizzes().find(q => q.id === quizId);
    if (!quiz) return 'Nicht verfügbar';

    const question = quiz.questions.find(q => q.id === questionId);
    return question?.correctAnswer || 'Nicht verfügbar';
  }
}
