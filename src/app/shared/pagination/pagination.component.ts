import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnChanges {

  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Output() pageChange = new EventEmitter<number>();

  pages: number[] = [];
  totalPages = 0;

  ngOnChanges(): void {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.buildPages();
  }

  buildPages() {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // ellipsis
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1); // ellipsis
      pages.push(total);
    }

    this.pages = pages;
  }

  goTo(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }
}
