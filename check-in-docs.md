
# Check-In System Documentation

## Overview

This document provides a comprehensive guide to the check-in system implemented in the application. The system allows users to check in at places, records their visits in the database, and awards badges for their first visit to a venue.

## Protected Files

The following files are critical to the check-in functionality and should not be modified without extensive testing:

1. `src/components/check-in/PlaceDetails.tsx` - Main component for nearby place check-in
2. `src/components/check-in/place-details/CheckInButton.tsx` - Button component for submitting check-ins
3. `src/components/check-in/place-details/useCheckInSubmission.tsx` - Hook that handles the check-in submission logic
4. `src/lib/checkinEngine.ts` - Central engine for processing all check-ins
5. `src/components/safe/PlaceDetails.tsx` - Backup implementation of the check-in functionality

## Check-In Flow

### User Action to Database Insert

1. **User Initiates Check-In**: 
   - User selects a place from the nearby places list or enters details manually
   - User fills out the check-in form (date/time, optional notes)
   - User clicks the "Check In" button

2. **Form Submission**:
   - `PlaceDetails.tsx` captures the form submission event
   - The form data is passed to `useCheckInSubmission.handleSubmit()`
   - The submission state is set to indicate loading (button shows spinner)

3. **Data Preparation**:
   - `useCheckInSubmission.tsx` validates user is authenticated
   - Required fields are collected and formatted into a `checkInData` object
   - A diagnostic toast confirms the check-in process has started

4. **Engine Processing**:
   - The data is passed to `checkInEngine.ts` via the `checkIn()` function
   - `processCheckIn()` validates all required fields are present
   - The function attempts to insert the record into the Supabase `check_ins` table

5. **Database Insert**:
   - The Supabase client executes an INSERT query to the `check_ins` table
   - On successful insert, the newly created record is returned

6. **Badge Processing**:
   - After successful check-in, the system attempts to award a badge if applicable
   - `awardFirstVisitBadge()` checks if this is the user's first visit to the venue
   - If it is, a badge is created and associated with the user

7. **User Feedback & Navigation**:
   - Success/error toasts are displayed to the user
   - On success, the page redirects to the profile page using `window.location.assign()`
   - If an error occurs, the error is displayed to the user

## Badge Creation Logic

Badges are awarded based on specific criteria:

1. **First Visit Badge**:
   - Awarded when a user checks in at a venue for the first time
   - The system queries existing check-ins to verify this is the first visit
   - Badge with type "first_visit" is created in the `badges` table

## Debugging and Troubleshooting

### Console Logs

Debug information is logged at various stages of the check-in process:

- `[PlaceDetails]` - Logs from the PlaceDetails component
- `[CheckInEngine]` - Logs from the central check-in engine
- `[toast]` - Logs from toast notifications

### Toast Notifications

The application displays visual feedback through toast notifications:

- Success toasts confirm check-in completion
- Error toasts show what went wrong during the process
- Debug toasts may appear if debug mode is enabled

### Common Issues and Solutions

1. **Check-in Not Completing**:
   - Check browser console for errors
   - Verify user is authenticated (user context exists)
   - Check required fields in form data
   - Verify Supabase connection and permissions

2. **No Badge Awarded**:
   - User may have already checked in at this venue before
   - Check badge award logic in `awardFirstVisitBadge()`

3. **Navigation Issues**:
   - If profile page doesn't load after check-in, check the redirect logic
   - The system uses `window.location.assign()` for a hard redirect rather than React Router

## Development Guidelines

1. **Testing Changes**:
   - Always test changes on all three check-in methods (Nearby, Manual, Test Button)
   - Use the debug mode to verify each step of the process
   - Check for both success and error states

2. **Extending the System**:
   - Create new components rather than modifying existing ones
   - Use the same pattern and engine for any new check-in methods
   - Keep the central engine logic consistent

3. **Fallback Strategy**:
   - If critical issues are encountered, revert to the code in the `stable-working-checkin` branch
   - Alternatively, use the backup implementation in `safe/PlaceDetails.tsx`
