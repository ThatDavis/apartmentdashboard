# Specification — Apartment Dashboard

> Last updated: Sun May 31 2026

## Overview

A PIN-protected mobile-friendly web application that allows neighbors in a shared space to view data from and control shared Home Assistant devices (soil sensors, switches) without requiring Home Assistant accounts. The app uses username + PIN authentication for security and is optimized for mobile devices.

## Milestone 1 — Basic Dashboard

### Features

#### Feature: Home Assistant Integration
**Description:** Connect to a Home Assistant instance via REST API and WebSocket to read device states and send control commands.
**Acceptance Criteria:**
- [ ] App successfully connects to configured HA instance
- [ ] Can read state of shared devices (sensors, switches, binary sensors)
- [ ] Can send toggle commands to switch devices
- [ ] Connection errors are handled gracefully with user-friendly messages
- [ ] `/health` endpoint reports HA connectivity status

#### Feature: PIN Authentication
**Description:** Simple username + PIN login system. No traditional user accounts — just username and PIN pairs stored securely.
**Acceptance Criteria:**
- [ ] Users can log in with username and PIN
- [ ] PINs are hashed with bcrypt before storage
- [ ] JWT tokens are issued upon successful login
- [ ] Invalid credentials return generic error message (no user enumeration)
- [ ] Account lockout after 5 failed attempts for 30 minutes
- [ ] Lockout attempts are logged with IP address

#### Feature: Device Dashboard
**Description:** Mobile-optimized dashboard showing all shared devices with their current status.
**Acceptance Criteria:**
- [ ] Dashboard displays all shared devices
- [ ] Device cards show name, type, and current state
- [ ] Switches have toggle controls
- [ ] Sensors display current reading
- [ ] Binary sensors show open/closed or on/off state
- [ ] Page loads in under 1 second

#### Feature: Battery Indicators
**Description:** Show battery level for battery-powered devices.
**Acceptance Criteria:**
- [ ] Battery percentage displayed for devices with battery entities
- [ ] Battery icon shown next to percentage
- [ ] Low battery warning (below 20%)

#### Feature: Offline Detection
**Description:** Clearly indicate when devices are offline or unreachable.
**Acceptance Criteria:**
- [ ] Offline devices shown with grayed-out styling
- [ ] "Offline" text displayed instead of last known state
- [ ] Last online timestamp shown (if available)

---

## Future Milestones

### Milestone 2: Data History
Brief description: Historical data visualization for sensor readings.

### Milestone 3: Sharing & Access
Brief description: Enhanced access control with multiple PINs and access logging.

## Non-Functional Requirements
- Sub-second page load time
- Mobile-first responsive design
- iOS Safari and Android Chrome support
- Secure authentication with rate limiting

## Open Questions
- [ ] Should we support multiple Home Assistant instances? — Owner: TBD, Due: TBD
- [ ] What's the expected number of concurrent users? — Owner: TBD, Due: TBD
