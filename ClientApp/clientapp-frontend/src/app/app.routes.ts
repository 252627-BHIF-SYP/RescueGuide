import { Routes } from '@angular/router';
import {Startscreen} from './startscreen/startscreen';
import {ConnectingComponent} from './connecting-component/connecting-component';
import {EmergencyPage} from './emergency-page/emergency-page';
import {QuizComponent} from './quiz/quiz';
import {Profile} from './profile/profile';
import {FastHelpComponent} from './fasthelp/fasthelp';
import {Login} from './login/login';

export const routes: Routes = [
  {
    path:'startscreen',
    component: Startscreen
  },
  {
    path:'',
    redirectTo: 'startscreen',
    pathMatch: 'full'
  },
  {
    path:'connecting',
    component: ConnectingComponent
  },
  {
    path:'emergency',
    component: EmergencyPage
  },
  {
    path:'quiz',
    component: QuizComponent
  },
  {
    path:'profile',
    component: Profile
  },
  {
    path:'fasthelp',
    component: FastHelpComponent
  }

  ,
  // Catch-all: redirect unknown routes to startscreen
  {
    path: '**',
    redirectTo: 'startscreen'
  }

];
