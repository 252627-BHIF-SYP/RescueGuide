import { Component, Inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragPlaceholder, CdkDragPreview } from '@angular/cdk/drag-drop';
import { InstructionMenuService, Measure } from '../../../services/instruction-menu.service';
import { CreateMeasureDialog } from '../create-measure-dialog/create-measure-dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'create-plan-dialog',
  templateUrl: './create-plan-dialog.html',
  styleUrl: './create-plan-dialog.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatAutocompleteModule,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview
  ]
})
export class CreatePlanDialog implements OnInit, OnDestroy {
  planForm: FormGroup;
  availableMeasures: Measure[] = [];
  filteredAvailableMeasures: Measure[] = [];
  orderedSelectedMeasures: Measure[] = [];

  tags: string[] = [];
  customTagInput = '';
  tagError: string | null = null;
  measureSearch = '';

  get allKnownTags(): string[] {
    return this.service.getAllKnownTags();
  }

  get filteredTagSuggestions(): string[] {
    const term = (this.customTagInput || '').trim().toLowerCase();
    if (!term) return [];
    return this.allKnownTags
      .filter(t => t.toLowerCase().includes(term) && !this.tags.includes(t))
      .slice(0, 8);
  }

  measureTagsPromptDismissed = false;
  private prevSelectedCount = 0;

  get canShowMeasureTagsImport(): boolean {
    if (this.measureTagsPromptDismissed) return false;
    return this.availableMeasureTags.length > 0;
  }

  get availableMeasureTags(): string[] {
    const candidateTags = new Set<string>();
    for (const m of this.orderedSelectedMeasures) {
      if (m.tags) {
        for (const t of m.tags) {
          const formatted = this.service.toTitleCase(t);
          if (formatted && !this.tags.includes(formatted)) {
            candidateTags.add(formatted);
          }
        }
      }
    }
    return Array.from(candidateTags).sort((a, b) => a.localeCompare(b, 'de'));
  }

  importTagsFromMeasures(): void {
    const toAdd = this.availableMeasureTags;
    for (const tag of toAdd) {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag);
      }
    }
    this.measureTagsPromptDismissed = true;
    this.tagError = null;
    this.cdr.detectChanges();
  }

  dismissMeasureTagsPrompt(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.measureTagsPromptDismissed = true;
    this.cdr.detectChanges();
  }

  private tempMeasureIds: number[] = [];
  private isSubmitted = false;
  private subscription?: Subscription;
  private formSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CreatePlanDialog>,
    private cdr: ChangeDetectorRef,
    public service: InstructionMenuService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.orderedSelectedMeasures = [...(data?.plan?.measures || [])];
    this.tags = Array.isArray(data?.plan?.tags) ? [...data.plan.tags] : [];

    this.planForm = this.fb.group({
      name: [data?.plan?.name || '', Validators.required],
      selectedMeasures: [this.orderedSelectedMeasures]
    });
  }

  ngOnInit() {
    this.prevSelectedCount = this.orderedSelectedMeasures.length;

    this.subscription = this.service.availableMeasures$.subscribe(measures => {
      this.availableMeasures = measures || [];
      this.applyMeasureFilter();
      this.cdr.detectChanges();
    });

    this.formSubscription = this.planForm.get('selectedMeasures')?.valueChanges.subscribe((selected: Measure[]) => {
      if (!selected) return;

      const currentCount = selected.length;
      if (currentCount < this.prevSelectedCount) {
        // Deselecting a measure: NEVER re-trigger or pop up the measure tags prompt!
        this.measureTagsPromptDismissed = true;
      }
      this.prevSelectedCount = currentCount;

      // Remove deselected measures
      this.orderedSelectedMeasures = this.orderedSelectedMeasures.filter(m =>
        selected.some(s => this.compareMeasures(s, m))
      );

      // Add newly selected measures at the end
      const newMeasures = selected.filter(s =>
        !this.orderedSelectedMeasures.some(m => this.compareMeasures(s, m))
      );
      this.orderedSelectedMeasures.push(...newMeasures);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.formSubscription?.unsubscribe();
    if (!this.isSubmitted) {
      this.tempMeasureIds.forEach(id => this.service.rollbackMeasure(id));
    }
  }

  // ── Plan Tag Operations ─────────────────────────────────────────────
  addTag(rawTag: string): void {
    const tag = this.service.toTitleCase((rawTag || '').trim().replace(/^[#,]/, ''));
    if (!tag) return;

    if (tag.length > 50) {
      this.tagError = 'Ein Tag darf maximal 50 Zeichen lang sein.';
      this.cdr.detectChanges();
      return;
    }
    if (!/^\p{L}+$/u.test(tag)) {
      this.tagError = 'Tags dürfen nur aus Buchstaben bestehen (keine Zahlen, Leerzeichen oder Sonderzeichen).';
      this.cdr.detectChanges();
      return;
    }
    this.tagError = null;

    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.customTagInput = '';
    this.cdr.detectChanges();
  }

  onTagSelected(event: MatAutocompleteSelectedEvent): void {
    this.addTag(event.option.viewValue);
  }

  onTagInput(): void {
    if (this.tagError) {
      this.tagError = null;
      this.cdr.detectChanges();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.cdr.detectChanges();
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag(this.customTagInput);
    }
  }

  // ── Step number & validation helpers ──────────────────────────────
  isPlanValid(): boolean {
    return !!(this.planForm.get('name')?.valid && this.orderedSelectedMeasures.length > 0);
  }

  // ── Measure filtering in selector ───────────────────────────────────
  applyMeasureFilter(): void {
    const term = (this.measureSearch || '').toLowerCase().trim();
    if (!term) {
      this.filteredAvailableMeasures = [...this.availableMeasures];
      return;
    }

    this.filteredAvailableMeasures = this.availableMeasures.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term) ||
      m.tags?.some(t => t.toLowerCase().includes(term))
    );
  }

  clearMeasureSearch(): void {
    this.measureSearch = '';
    this.applyMeasureFilter();
  }

  createNewMeasure() {
    const dialogRef = this.dialog.open(CreateMeasureDialog, {
      width: '840px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createMeasure(result.name, result.description, result.imageUrl, result.tags).subscribe({
          next: (newMeasure) => {
            this.tempMeasureIds.push(newMeasure.id);
            const currentSelected = this.planForm.get('selectedMeasures')?.value || [];
            this.planForm.get('selectedMeasures')?.setValue([...currentSelected, newMeasure]);
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Failed to create new measure from plan dialog', err)
        });
      }
    });
  }

  removeSelectedMeasure(index: number, event: Event): void {
    event.stopPropagation();
    const removed = this.orderedSelectedMeasures[index];
    this.orderedSelectedMeasures.splice(index, 1);
    const current = (this.planForm.get('selectedMeasures')?.value || []) as Measure[];
    this.planForm.get('selectedMeasures')?.setValue(current.filter(m => !this.compareMeasures(m, removed)));
    this.cdr.detectChanges();
  }

  submit() {
    if (!this.isPlanValid()) return;
    this.isSubmitted = true;
    this.dialogRef.close({
      name: this.planForm.get('name')?.value,
      selectedMeasures: this.orderedSelectedMeasures,
      tags: this.tags
    });
  }

  drop(event: CdkDragDrop<Measure[]>) {
    moveItemInArray(this.orderedSelectedMeasures, event.previousIndex, event.currentIndex);
  }

  compareMeasures(o1: Measure, o2: Measure): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }
}
