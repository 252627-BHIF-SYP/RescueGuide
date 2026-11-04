import { Component, Inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { InstructionMenuService } from '../../../services/instruction-menu.service';

@Component({
  selector: 'create-measure-dialog',
  templateUrl: './create-measure-dialog.html',
  styleUrl: './create-measure-dialog.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule
  ]
})
export class CreateMeasureDialog {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  measureForm: FormGroup;
  imagePreview?: string;
  isDraggingOver = false;
  fileError?: string;

  tags: string[] = [];
  customTagInput: string = '';
  tagError?: string;

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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateMeasureDialog>,
    private cdr: ChangeDetectorRef,
    public service: InstructionMenuService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.measureForm = this.fb.group({
      name: [data?.measure?.name || '', Validators.required],
      description: [data?.measure?.description || ''],
      imageUrl: [data?.measure?.imageUrl || '']
    });
    this.imagePreview = data?.measure?.imageUrl;
    this.tags = Array.isArray(data?.measure?.tags) ? [...data.measure.tags] : [];
  }

  triggerFileSelect() {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          this.processFile(file);
          break;
        }
      }
    }
  }

  processFile(file: File) {
    this.fileError = undefined;

    if (!file.type.startsWith('image/')) {
      this.fileError = 'Nur Bildformate (PNG, JPG, SVG, WebP) sind zulässig.';
      this.cdr.markForCheck();
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'Das Bild überschreitet die Maximalgröße von 5 MB.';
      this.cdr.markForCheck();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagePreview = result;
      this.measureForm.get('imageUrl')?.setValue(result);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview = undefined;
    this.fileError = undefined;
    this.measureForm.get('imageUrl')?.setValue('');
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

  // ── Tag Operations ──────────────────────────────────────────────────
  addTag(rawTag: string): void {
    const tag = this.service.toTitleCase((rawTag || '').trim().replace(/^[#,]/, ''));
    if (!tag) return;

    if (tag.length > 50) {
      this.tagError = 'Ein Tag darf maximal 50 Zeichen lang sein.';
      this.cdr.markForCheck();
      return;
    }
    if (!/^\p{L}+$/u.test(tag)) {
      this.tagError = 'Tags dürfen nur aus Buchstaben bestehen (keine Zahlen, Leerzeichen oder Sonderzeichen).';
      this.cdr.markForCheck();
      return;
    }
    this.tagError = undefined;

    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.customTagInput = '';
    this.cdr.markForCheck();
  }

  onTagSelected(event: MatAutocompleteSelectedEvent): void {
    this.addTag(event.option.viewValue);
  }

  onTagInput(): void {
    if (this.tagError) {
      this.tagError = undefined;
      this.cdr.markForCheck();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.cdr.markForCheck();
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag(this.customTagInput);
    }
  }

  submit() {
    this.dialogRef.close({
      name: this.measureForm.get('name')?.value,
      description: this.measureForm.get('description')?.value,
      imageUrl: this.measureForm.get('imageUrl')?.value,
      tags: this.tags
    });
  }
}
