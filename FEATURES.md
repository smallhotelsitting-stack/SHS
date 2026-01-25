# Small Hotel Sitting - Feature Documentation

## Overview
Small Hotel Sitting is a multilingual platform connecting hotel guests with verified sitters, implementing the complete PRD with trust, safety, and compliance features.

---

## 🔐 Epic 1: Identity Verification System

### User Flow (Sitters)
1. **Upload Documents**
   - Navigate to Profile Menu → "Verification"
   - Select document type (Passport, Driver's License, National ID)
   - Upload image/PDF (max 5MB)
   - Documents stored securely in encrypted Supabase Storage

2. **Track Status**
   - View verification history
   - See real-time status (Pending, Approved, Rejected)
   - Receive rejection reasons if declined

### Admin Flow
1. **Review Documents**
   - Access Admin Dashboard → "Verifications" tab
   - Badge shows pending verification count
   - View submitted documents with user details
   - Click "View Document" to open in new tab

2. **Approve/Reject**
   - **Approve**: Sets `is_verified = true` on user profile
   - **Reject**: Requires rejection reason for user feedback
   - All actions logged in audit trail

### Database Tables
- `verification_documents`: Stores document metadata
- `storage.objects`: Encrypted document storage
- RLS ensures users see only their docs; admins see all

---

## 🏨 Epic 2: Night Protocol (Care Instructions)

### Feature Details
Special form section that appears when:
- Listing type = "Request" (family seeking sitter)
- Category = "Hotel"

### Fields Captured
1. **Hotel Name**: Accommodation details
2. **Bedtime Routine**: Sleep schedule and rituals
3. **Allergies & Dietary Restrictions**: Critical safety information
4. **Special Instructions**: Comfort items, fears, preferences
5. **Emergency Contact**: Parent/guardian phone number

### Data Storage
- Stored as JSONB in `listings.night_protocol`
- Flexible structure allows future expansion
- Visible to sitters after booking confirmed

### Use Cases
- Family traveling in Miami needs evening childcare
- Sitter gets comprehensive care guide before arrival
- Reduces miscommunication and improves child safety

---

## 💳 Epic 3: Subscription System (Database Ready)

### Implementation Status
**Database**: ✅ Complete
**Stripe Integration**: ⚠️ Pending (see Stripe section below)

### Tables Created
- `subscriptions`: User subscription tiers and Stripe IDs
- Columns: tier (free/premium), stripe_customer_id, current_period_end

### Planned Features
1. **Free Tier**
   - Browse profiles
   - View listings
   - See verification badges

2. **Premium Tier**
   - Unlock messaging
   - Create bookings
   - Contact sitters directly

### Gating Logic (To Implement)
```typescript
// Example: Block messaging for free users
if (profile.subscription_tier === 'free') {
  return <UpgradePrompt />;
}
```

---

## ⭐ Epic 4: Reviews & Reputation

### System Requirements
- Reviews ONLY allowed after completed booking
- Database function `can_user_review()` validates eligibility
- Prevents fake reviews

### Tables
- `bookings`: Tracks confirmed transactions
- `reviews`: 5-star ratings with comments
- Foreign key: `reviews.booking_id → bookings.id`

### Review Flow
1. Booking created → status: pending
2. Payment processed → status: confirmed
3. Service completed → status: completed
4. **Both parties can now review each other**

### UI Components (To Build)
- Review submission form (post-booking)
- Star rating display on profiles
- Written testimonials

---

## 🍪 Epic 5: GDPR Compliance

### Cookie Consent Banner
**Location**: Bottom of every page

**Options**:
1. **Necessary** (Always enabled): Session, authentication
2. **Analytics** (Optional): Usage tracking, performance
3. **Marketing** (Optional): Personalized ads

**User Actions**:
- Accept All
- Save Preferences
- Reject All

**Data Storage**:
- `localStorage`: Client-side preference
- `gdpr_consents` table: Database record with timestamp + IP

### Data Deletion Workflow
**User Flow**:
1. Profile → Danger Zone → "Request Account Deletion"
2. Type "DELETE" to confirm
3. Request submitted to admin queue

**Admin Processing**:
- Review request in Admin Dashboard
- Verify legitimacy
- Execute deletion (soft-delete via `deleted_at` timestamps)
- Records cascade: listings, messages, reviews, documents

**Tables**:
- `data_deletion_requests`: Status (pending, processing, completed)
- All tables have `deleted_at` column for GDPR compliance

---

## 🛡️ Security Features

### Row Level Security (RLS)
**All tables protected** with Postgres RLS:
- Users see only their data
- Admins have elevated access
- Sitters can't access family data (and vice versa)

### Document Encryption
- Verification documents stored in private bucket
- Access controlled via RLS policies
- Admins can view for verification only

### Audit Logging
**Every admin action tracked**:
- User suspensions
- Role changes
- Verification approvals
- Listing flagging/deletion

**Audit Log Fields**:
- Action type
- Entity affected
- Old vs. new values
- Timestamp
- IP address
- User agent

---

## 🌍 Multilingual Support

### Current Languages
- English (EN)
- Spanish (ES)
- French (FR)

### Auto-Translation
- Uses Edge Function (`/functions/translate`)
- Translates listing title, description, location
- Stored in `listings.translations` JSONB field

### Implementation
```typescript
const translations = await translateToAllLanguages({
  title: "Family needs sitter",
  description: "Two kids, ages 5 and 7",
  location: "Miami Beach"
});
```

---

## 📊 Admin Dashboard

### Tabs

#### 1. Users Management
- View all users
- Change roles (guest, family, sitter, admin)
- Suspend/unsuspend accounts
- Delete users

#### 2. Listings Management
- Flag inappropriate listings
- Change listing status
- Delete listings
- View listing details

#### 3. Audit Log
- View all admin actions
- Filter by action type
- See timestamps and IPs

#### 4. Admin Users
- Promote users to admin
- Demote admins to regular users
- View admin list

#### 5. **NEW** Verifications
- Pending document count badge
- Approve/reject ID documents
- View rejection history

---

## 🚀 Getting Started

### For Families
1. Register → Role: "Family"
2. Create listing (type: "Request")
3. Fill Night Protocol if hotel-based
4. Wait for sitter messages (premium feature)

### For Sitters
1. Register → Role: "Sitter"
2. Upload ID verification
3. Wait for admin approval
4. Browse family requests
5. Contact families (premium feature)

### For Admins
1. Get promoted via SQL or existing admin
2. Access Admin Dashboard from nav bar
3. Review verification documents
4. Monitor platform activity via audit log

---

## ⚠️ Pending Features

### 1. Stripe Integration
**Status**: Database tables ready, Stripe code pending

**Required Environment Variables**:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Implementation Steps**:
1. Create Stripe products (Premium Monthly/Yearly)
2. Build checkout flow
3. Handle webhooks for subscription updates
4. Gate messaging/booking features

**See**: https://bolt.new/setup/stripe

### 2. Subscription Gating
Lock these features behind premium tier:
- Messaging system (Inbox, Threads)
- Booking creation
- Contact detail visibility

### 3. Review UI
Build components for:
- Submitting reviews post-booking
- Displaying star ratings on profiles
- Showing written reviews

### 4. Profile Locking
**Sitters**: Block profile visibility until `is_verified = true`
**Implementation**: Add check in profile rendering

---

## 🔧 Technical Architecture

### Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (warm color palette)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (encrypted)
- **i18n**: Custom translation system with Edge Function

### Color Scheme
- **Primary**: Orange tones (#f97316 - warm, trustworthy)
- **Secondary**: Amber/brown (#d97706 - earth tones)
- **Neutral**: Warm grays for backgrounds
- **Avoids**: Purple, indigo (per design requirements)

### Database Best Practices
✅ RLS enabled on all tables
✅ Soft deletes with `deleted_at`
✅ Foreign keys with CASCADE
✅ Indexes on frequently queried columns
✅ JSONB for flexible schema (night_protocol, translations)

---

## 📱 Mobile Responsiveness

All pages optimized for:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)

Mobile-first design with:
- Collapsible navigation
- Touch-friendly buttons
- Optimized forms

---

## 🧪 Testing Checklist

### ID Verification
- [ ] Upload document as sitter
- [ ] Admin sees document in dashboard
- [ ] Approve → user.is_verified = true
- [ ] Reject → user sees reason

### Night Protocol
- [ ] Create hotel listing as family (type: request)
- [ ] Fill all protocol fields
- [ ] Verify data saved in database
- [ ] Check sitter can view protocol

### GDPR
- [ ] Cookie banner appears on first visit
- [ ] Preferences saved in localStorage
- [ ] Request account deletion
- [ ] Admin sees deletion request

### Admin Features
- [ ] All tabs load without errors
- [ ] Audit log captures actions
- [ ] Role changes work correctly
- [ ] Verification approval updates profile

---

## 🆘 Troubleshooting

### Issue: Verification upload fails
**Solution**: Check Supabase Storage bucket exists and RLS policies allow uploads

### Issue: Cookie banner won't dismiss
**Solution**: Check localStorage not disabled in browser

### Issue: Admin can't see verifications
**Solution**: Verify user role is 'admin' in database

### Issue: Translations not working
**Solution**: Check Edge Function is deployed: `supabase functions list`

---

## 📄 License & Compliance

- **GDPR**: Full compliance with data deletion rights
- **Cookie Law**: Explicit consent before non-essential cookies
- **Data Encryption**: Sensitive documents encrypted at rest
- **Audit Trail**: All admin actions logged for accountability

---

## 🎯 Next Steps (Recommended Priority)

1. **Stripe Integration** (High Priority)
   - Implement checkout flow
   - Add subscription gating to messaging
   - Handle payment webhooks

2. **Review System UI** (Medium Priority)
   - Build review submission form
   - Display reviews on profiles
   - Add star ratings

3. **Profile Locking** (Medium Priority)
   - Hide unverified sitter profiles
   - Show verification required message

4. **Enhanced Messaging** (Low Priority)
   - Real-time updates via Supabase Realtime
   - Typing indicators
   - Read receipts

5. **Search & Filters** (Low Priority)
   - Location-based search
   - Date range filtering
   - Category filters

---

For questions or issues, check:
- `ADMIN_SETUP.md`: Admin account setup
- Database migrations: `supabase/migrations/`
- Edge Functions: `supabase/functions/`
