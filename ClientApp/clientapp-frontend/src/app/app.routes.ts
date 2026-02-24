import { Routes } from '@angular/router';
import {Startscreen} from './startscreen/startscreen';
import {Gps} from './gps/gps';
import {ConnectingComponent} from './connecting-component/connecting-component';
import {EmergencyPage} from './emergency-page/emergency-page';
import {Study} from './study/study';
import {Profile} from './profile/profile';
import {FastHelpComponent} from './fasthelp/fasthelp';
import {Login} from './login/login';

export const routes: Routes = [
  {
    path:'startscreen',
    component: Startscreen
  },
  {
    path:'login',
    component: Login
  },
  {
    path:'gps',
    component: Gps
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
    path:'study',
    component: Study
  },
  {
    path:'profile',
    component: Profile
  },
  {
    path:'fasthelp',
    component: FastHelpComponent
  }

];
