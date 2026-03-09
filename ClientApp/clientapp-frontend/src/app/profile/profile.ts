import {Component, inject} from '@angular/core';
import {QuizService} from '../quiz-service';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {Navbar} from '../navbar/navbar';

@Component({
  selector: 'app-profile',
  imports: [
    MatIcon,
    MatIconButton,
    RouterLink,
    Navbar
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  public quizService = inject(QuizService);

}
