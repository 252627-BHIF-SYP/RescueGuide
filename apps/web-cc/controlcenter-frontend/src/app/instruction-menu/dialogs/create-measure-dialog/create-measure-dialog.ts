import { Component, Inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'create-measure-dialog',
  templateUrl: './create-measure-dialog.html',
  styleUrl: './create-measure-dialog.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButton,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class CreateMeasureDialog {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  measureForm: FormGroup;
  imagePreview?: string;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.measureForm = this.fb.group({
      name: [data?.measure?.name || '', Validators.required],
      description: [data?.measure?.description || ''],
      imageUrl: [data?.measure?.imageUrl || '']
    });
    this.imagePreview = data?.measure?.imageUrl;
  }

  triggerFileSelect() {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagePreview = result;
      this.measureForm.get('imageUrl')?.setValue(result);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }
}
