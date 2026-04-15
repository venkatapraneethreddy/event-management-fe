import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, CheckboxModule, MessageModule, DividerModule, TagModule, FileUploadModule, TextareaModule, IconFieldModule, InputIconModule],
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.scss']
})
export class EditEventComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  eventId!: number;
  loading = true;
  saving = false;
  event: any = null;

  readonly categories = ['TECHNICAL','CULTURAL','SPORTS','WORKSHOP','SEMINAR','SOCIAL','OTHER'];
  selectedFile: File | null = null;
  uploadingImage = false;
  imagePreviewUrl: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private eventService: EventService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      location:    ['', Validators.required],
      eventDate:   ['', Validators.required],
      capacity:    [null, [Validators.required, Validators.min(1)]],
      category:    ['OTHER'],
      paid:        [false],
      fee:         [0, Validators.min(0)]
    });
  }

  ngOnInit(): void {
    // Use params observable so it reloads if the eventId changes
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          this.eventId = Number(params['eventId']);
          this.loading = true;
          return this.eventService.getEventById(this.eventId);
        })
      )
      .subscribe({
        next: (event) => {
          this.event = event;
          this.imagePreviewUrl = event.imageUrl || null;
          const dateStr = event.eventDate
            ? new Date(event.eventDate).toISOString().slice(0, 16) : '';
          this.form.patchValue({
            title: event.title, description: event.description,
            location: event.location, eventDate: dateStr,
            capacity: event.capacity, category: event.category || 'OTHER',
            paid: event.paid, fee: event.fee ?? 0
          });
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Could not load event');
          this.router.navigate(['/organizer/my-events']);
        }
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onFileSelected(event: any) {
    const file = event?.files?.[0] ?? null;
    if (file) {
      if (!file.type.startsWith('image/')) { this.toastr.error('Please select an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { this.toastr.error('Image must be under 5MB'); return; }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreviewUrl = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  uploadImage() {
    if (!this.selectedFile) return;
    this.uploadingImage = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    this.eventService.uploadEventImage(this.eventId, formData).subscribe({
      next: (res: any) => {
        this.toastr.success('Image uploaded!');
        this.uploadingImage = false;
        this.selectedFile = null;
        this.imagePreviewUrl = res.imageUrl;
      },
      error: (err) => {
        this.uploadingImage = false;
        this.toastr.error(err.error?.error || 'Failed to upload image');
      }
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.eventService.updateEvent(this.eventId, this.form.value).subscribe({
      next: () => { this.toastr.success('Event updated'); this.router.navigate(['/organizer/my-events']); },
      error: (err) => { this.saving = false; this.toastr.error(err.error?.error || 'Failed to update event'); }
    });
  }

  goBack() { this.router.navigate(['/organizer/my-events']); }
}
