import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../core/models/event.model';
import { RegistrationService } from '../../../core/services/registration.service';
import { ToastrService } from 'ngx-toastr';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent {

  @Input() event!: Event;
  @Input() alreadyRegistered = false;

  registering = false;
  registered = false;

  constructor(private registrationService: RegistrationService,
  private toastr: ToastrService) {}

 register() {
  if (this.alreadyRegistered || this.registered) return;

  this.registering = true;

  this.registrationService.register(this.event.eventId).subscribe({
    next: () => {
      this.registering = false;
      this.registered = true;

      this.toastr.success(
        'You have successfully registered!',
        'Registration Successful'
      );
    },
    error: () => {
      this.registering = false;

      this.toastr.error(
        'Something went wrong. Please try again.',
        'Registration Failed'
      );
    }
  });
}
}
