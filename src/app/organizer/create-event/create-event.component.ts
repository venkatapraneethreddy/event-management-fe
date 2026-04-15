import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { ClubService } from '../../core/services/club.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, CheckboxModule, MessageModule, DividerModule, IconFieldModule, InputIconModule, TextareaModule],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss'
})
export class CreateEventComponent implements OnInit {

  form!: FormGroup;
  loading = false;
  clubId!: number;
  clubStatus: string = '';
  clubLoading = true;

  readonly categories = ['TECHNICAL','CULTURAL','SPORTS','WORKSHOP','SEMINAR','SOCIAL','OTHER'];

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private clubService: ClubService,
    public router: Router,
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
    this.clubService.getMyClub().subscribe({
      next: (res: any) => {
        if (res?.club) { this.clubId = res.club.clubId; this.clubStatus = res.club.status; }
        this.clubLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.toastr.error('Could not fetch club info'); this.clubLoading = false; this.cdr.detectChanges(); }
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.clubStatus !== 'APPROVED') {
      this.toastr.warning('Your club must be approved before creating events'); return;
    }
    this.loading = true;
    this.eventService.createEvent(this.clubId, this.form.value).subscribe({
      next: () => { this.toastr.success('Event created!'); this.router.navigate(['/organizer/my-events']); },
      error: (err) => { this.toastr.error(err.error?.error || 'Failed to create event'); this.loading = false; }
    });
  }

  goBack() { this.router.navigate(['/organizer/my-events']); }
}
