import { Routes } from '@angular/router';
import {InstructionMenu} from './instruction-menu/instruction-menu';
import {EmergencyPage} from './emergency-page/emergency-page';

export const routes: Routes = [
  {
    path:'instruction-menu',
    component: InstructionMenu
  },
  {
    path:'emergency-page',
    component: EmergencyPage
  }

];
