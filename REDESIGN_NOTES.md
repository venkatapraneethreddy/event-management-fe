# EventClub UI Redesign — PrimeNG Migration Guide

## What Changed

### Design System
- **Font**: Replaced `Inter + Plus Jakarta Sans` → `DM Sans + DM Mono`
- **Icons**: Removed all emoji icons → replaced with `PrimeIcons` (`pi pi-*`)
- **Color palette**: Indigo-based brand (`#4f46e5`) with semantic success/warning/danger tokens
- **Animations**: Page fade-in on all routes, stagger animations on card grids
- **Spacing**: Consistent 8px grid system throughout

### PrimeNG Components Used Per Page

| Page | PrimeNG Components |
|------|--------------------|
| Login | `p-button`, `p-iconfield`, `p-inputicon`, `p-checkbox`, `p-message`, `p-chip`, `p-divider` |
| Layouts (all 3) | `p-avatar`, `p-button`, `p-badge`, `p-toast`, `p-message`, `p-tooltip` |
| Student Dashboard | `p-selectbutton`, `p-chip`, `p-tag`, `p-progressbar`, `p-skeleton`, `p-avatar`, `p-button` |
| Admin Dashboard | `p-tag`, `p-skeleton`, `p-button`, `p-badge` |
| Organizer Dashboard | `p-avatar`, `p-tag`, `p-message`, `p-button` |
| Club Approvals | `p-table`, `p-tag`, `p-button`, `p-avatar`, `p-iconfield`, `p-skeleton` |
| My Events | `p-tabmenu`, `p-chip`, `p-tag`, `p-button`, `p-iconfield` |
| Create Event | `p-button`, `p-inputtext`, `p-inputnumber`, `p-select`, `p-checkbox`, `p-message`, `p-divider` |
| Edit Event | `p-button`, `p-fileupload`, `p-tag`, `p-select`, `p-inputnumber`, `p-checkbox`, `p-message` |
| My Registrations | `p-selectbutton`, `p-tag`, `p-avatar`, `p-button`, `p-dialog`, `p-message` |
| Event Detail | `p-tag`, `p-progressbar`, `p-button`, `p-divider`, `p-message` |
| Analytics | `p-table`, `p-tag`, `p-skeleton` |
| Admin Users | `p-table`, `p-tag`, `p-avatar`, `p-skeleton`, `p-iconfield` |
| Admin Events | `p-table`, `p-tag`, `p-chip`, `p-button`, `p-skeleton` |
| QR Scanner | `p-button`, `p-message` |
| Profile | `p-avatar`, `p-tag`, `p-button`, `p-divider`, `p-message` |
| Create Club | `p-avatar`, `p-tag`, `p-button`, `p-message` |
| Event Registrants | `p-table`, `p-tag`, `p-avatar`, `p-button` |

## Setup Instructions

### 1. Install dependencies
```bash
npm install primeng @primeng/themes primeicons
```

### 2. app.config.ts — PrimeNG provider (already updated)
The `providePrimeNG` with Aura theme preset is configured in `app.config.ts`.

### 3. index.html — PrimeIcons CDN (already updated)
PrimeIcons loaded from CDN. Alternatively install locally:
```bash
npm install primeicons
```
And add to `angular.json` styles:
```json
"styles": ["node_modules/primeicons/primeicons.css", "src/styles.scss"]
```

### 4. angular.json — Add PrimeIcons to styles (if not using CDN)
```json
"styles": [
  "node_modules/primeicons/primeicons.css",
  "src/styles.scss"
]
```

## Key Improvements

### UX Improvements
- **Stagger animations** — cards animate in sequentially on page load
- **Skeleton loaders** — replace plain spinners on dashboards
- **p-dialog** for ticket modal — proper backdrop, keyboard-accessible
- **p-selectbutton** for fee/time filters — cleaner than custom tab buttons  
- **p-table** for all data tables — sortable, paginated, accessible
- **p-progressbar** for capacity bars — smooth, animated
- **p-tag** for all status/role/type badges — consistent severity colors
- **p-avatar** for all user/club initials — consistent sizing

### No More Emojis
All emoji icons replaced with semantic PrimeIcons:
- `🎓` → `pi pi-graduation-cap`
- `🏛` → `pi pi-building`
- `📷` / QR → `pi pi-qrcode`
- `📍` → `pi pi-map-marker`
- `🗓` → `pi pi-calendar`
- `👥` → `pi pi-users`
- `💰` → `pi pi-indian-rupee`
- `⏳` → `pi pi-clock`
- `✅` → `pi pi-check-circle`
- `❌` → `pi pi-times-circle`
- `🎟` → `pi pi-ticket`
- `📊` → `pi pi-chart-bar`
- `🔐` → `pi pi-shield`

