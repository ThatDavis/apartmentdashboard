# Specification — Apartment Dashboard

> Last updated: Tue Jun 02 2026

## Overview

A PIN-protected mobile-friendly web application that allows neighbors in a shared space to view data from and control shared Home Assistant devices (soil sensors, switches) without requiring Home Assistant accounts. The app uses username + PIN authentication for security and is optimized for mobile devices.

## Milestone 1 — Basic Dashboard

### Features

#### Feature: Home Assistant Integration
**Description:** Connect to a Home Assistant instance via REST API to read device states and send control commands.
**Acceptance Criteria:**
- [x] App successfully connects to configured HA instance
- [x] Can read state of shared devices (sensors, switches, binary sensors)
- [x] Can send toggle commands to switch devices
- [x] Connection errors are handled gracefully with user-friendly messages
- [x] `/health` endpoint reports HA connectivity status

#### Feature: PIN Authentication
**Description:** Simple username + PIN login system. No traditional user accounts — just username and PIN pairs stored securely.
**Acceptance Criteria:**
- [x] Users can log in with username and PIN
- [x] PINs are hashed with bcrypt before storage
- [x] JWT tokens are issued upon successful login
- [x] Invalid credentials return generic error message (no user enumeration)
- [x] Account lockout after 5 failed attempts for 30 minutes
- [x] Lockout attempts are logged with IP address

#### Feature: Device Dashboard
**Description:** Mobile-optimized dashboard showing all shared devices with their current status.
**Acceptance Criteria:**
- [x] Dashboard displays all shared devices
- [x] Device cards show name, type, and current state
- [x] Switches have toggle controls
- [x] Sensors display current reading
- [x] Binary sensors show open/closed or on/off state
- [x] Page loads in under 1 second
- [x] Real-time updates via 5-second polling

#### Feature: Battery Indicators
**Description:** Show battery level for battery-powered devices.
**Acceptance Criteria:**
- [x] Battery percentage displayed for devices with battery entities
- [x] Battery icon shown next to percentage
- [x] Low battery warning (below 20%)

#### Feature: Offline Detection
**Description:** Clearly indicate when devices are offline or unreachable.
**Acceptance Criteria:**
- [x] Offline devices shown with grayed-out styling
- [x] "Offline" text displayed instead of last known state
- [x] Last online timestamp shown (if available)

---

## Milestone 2: Switch Scheduling & Twilight Theme

### Feature: Switch Scheduling
**Description:** Visual 24-hour switch scheduler with draggable timeline and automatic execution.
**Acceptance Criteria:**
- [x] Visual 24-hour slider with draggable handles
- [x] Civil twilight zones displayed as gradient background
- [x] 15-minute snap intervals for precise scheduling
- [x] Automatic on/off execution based on schedule times
- [x] Background scheduler runs every 60 seconds
- [x] DST-aware with Chicago timezone (America/Chicago)
- [x] All users (not just admins) can create schedules

### Feature: Twilight Theme
**Description:** Automatic light/dark theme based on civil twilight times with manual override.
**Acceptance Criteria:**
- [x] Fetches dawn/dusk times for Chicago, IL
- [x] Automatically transitions between light and dark themes
- [x] Smooth 2-second color transitions
- [x] Manual override toggle (Auto / Light / Dark)
- [x] Sun/moon icon in dashboard header
- [x] Theme preview button in admin panel
- [x] Uses JavaScript-calculated CSS custom properties for browser compatibility

### Feature: Glass Morphism UI
**Description:** Translucent glass-like UI elements that work over wallpaper backgrounds.
**Acceptance Criteria:**
- [x] Semi-transparent backgrounds with heavy blur
- [x] Beveled edges via inset box shadows
- [x] Consistent glass effect on cards, buttons, and inputs
- [x] Works with both light and dark backgrounds

---

## Milestone 3: Admin & Data History

### Feature: Admin User Management
**Description:** Admin-only user management for creating, listing, deleting users and changing PINs.
**Acceptance Criteria:**
- [x] List all users with admin status
- [x] Delete users (with confirmation)
- [x] Change user PINs
- [x] Create new users with optional admin flag
- [x] Accessible from admin panel gear icon

### Feature: Sensor History
**Description:** 48-hour historical data visualization for sensor readings.
**Acceptance Criteria:**
- [ ] SVG line chart showing 48-hour trends
- [ ] Data aggregation and storage
- [ ] Hover tooltips with exact values

## Non-Functional Requirements
- Sub-second page load time
- Mobile-first responsive design
- iOS Safari and Android Chrome support
- Secure authentication with rate limiting
- No secrets in code

## Open Questions
- [ ] Should we support multiple Home Assistant instances? — Owner: TBD, Due: TBD
- [ ] What's the expected number of concurrent users? — Owner: TBD, Due: TBD
