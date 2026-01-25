# Testing Guide: Admin Features

## Quick Start Testing

### Prerequisites

1. Ensure you have admin role in your profile
2. Navigate to the Home page
3. Look for "+ Add Category" button (visible only to admins)

### Test 1: Create "Vehicles" Category

**Steps:**
1. Click "+ Add Category" button
2. Enter "Vehicles" in the modal
3. Click "Create"
4. Form builder should auto-open

**Expected Result:**
- Modal closes
- Toast shows: "Category 'Vehicles' created! Now add form fields."
- Form builder modal opens with empty field list

### Test 2: Configure Vehicle Form Fields

Add these fields in order:

**Field 1: Vehicle Type (Dropdown)**
- Click "Add Field" → "Dropdown"
- Click field to expand
- Label: "Vehicle Type"
- Options (paste in text area):
  ```
  Car
  Motorcycle
  RV/Camper
  Boat
  Bicycle
  Scooter
  Other
  ```
- Toggle "Required field" ON
- Click outside to collapse

**Field 2: Make & Model (Text)**
- Click "Add Field" → "Text Input"
- Label: "Make & Model"
- Placeholder: "e.g., Toyota Camry 2020"
- Max Length: (leave empty, default OK)
- Toggle "Required field" ON

**Field 3: Year (Number)**
- Click "Add Field" → "Number"
- Label: "Year"
- Placeholder: "2020"
- Min Value: "1900"
- Max Value: "2026"
- Toggle "Required field" ON

**Field 4: Insurance Included (Radio)**
- Click "Add Field" → "Radio Buttons"
- Label: "Insurance Included?"
- Options:
  ```
  Yes - Full Coverage
  Yes - Basic Coverage
  No - Renter Must Arrange
  Not Applicable
  ```
- Toggle "Required field" ON

**Field 5: Insurance Details (Textarea)**
- Click "Add Field" → "Text Area"
- Label: "Insurance Details"
- Placeholder: "Explain coverage limits, deductibles, or requirements..."
- Max Length: "300"
- Toggle "Required field" OFF

**Field 6: Daily Rate (Number)**
- Click "Add Field" → "Number"
- Label: "Daily Rate ($)"
- Placeholder: "50"
- Min Value: "1"
- Toggle "Required field" ON

**Field 7: Security Deposit (Number)**
- Click "Add Field" → "Number"
- Label: "Security Deposit ($)"
- Placeholder: "500"
- Min Value: "0"
- Toggle "Required field" ON

**Field 8: Location (Text)**
- Click "Add Field" → "Text Input"
- Label: "Location"
- Placeholder: "City, Country"
- Toggle "Required field" ON

**Field 9: Available From (Date)**
- Click "Add Field" → "Date"
- Label: "Available From"
- Toggle "Required field" ON

**Field 10: Available Until (Date)**
- Click "Add Field" → "Date"
- Label: "Available Until"
- Toggle "Required field" ON

**Field 11: Transmission (Dropdown)**
- Click "Add Field" → "Dropdown"
- Label: "Transmission"
- Options:
  ```
  Automatic
  Manual
  N/A
  ```
- Toggle "Required field" OFF

**Field 12: Fuel Type (Dropdown)**
- Click "Add Field" → "Dropdown"
- Label: "Fuel Type"
- Options:
  ```
  Gasoline
  Diesel
  Electric
  Hybrid
  N/A
  ```
- Toggle "Required field" OFF

**Field 13: Passenger Capacity (Number)**
- Click "Add Field" → "Number"
- Label: "Passenger Capacity"
- Placeholder: "4"
- Min Value: "1"
- Max Value: "50"
- Toggle "Required field" OFF

**Field 14: Features & Amenities (Checkboxes)**
- Click "Add Field" → "Checkboxes"
- Label: "Features & Amenities"
- Options:
  ```
  Air Conditioning
  GPS Navigation
  Bluetooth
  Backup Camera
  Child Seat Available
  Roof Rack
  Bike Rack
  Pet Friendly
  ```
- Toggle "Required field" OFF

**Field 15: License Requirements (Radio)**
- Click "Add Field" → "Radio Buttons"
- Label: "License Requirements"
- Options:
  ```
  Standard Driver's License
  International License Accepted
  Special License Required
  No License Needed
  ```
- Toggle "Required field" ON

**Field 16: Vehicle Description (Textarea)**
- Click "Add Field" → "Text Area"
- Label: "Vehicle Description & Rules"
- Placeholder: "Condition, mileage limits, smoking policy, fuel policy, pickup/return instructions..."
- Max Length: "800"
- Toggle "Required field" ON

**Field 17: Vehicle Photos (File Upload)**
- Click "Add Field" → "File Upload"
- Label: "Vehicle Photos"
- Toggle "Allow multiple files" ON
- Max Files: "8"
- Accepted Types: "image/jpeg,image/png,image/webp"
- Toggle "Required field" ON

**Field 18: Documents (File Upload)**
- Click "Add Field" → "File Upload"
- Label: "Registration/Insurance Documents (Optional)"
- Toggle "Allow multiple files" ON
- Max Files: "3"
- Accepted Types: ".pdf,image/*"
- Toggle "Required field" OFF

**After Adding All Fields:**
1. Click "Show Preview" button
2. Scroll through preview to see all fields render correctly
3. Click "Save Form" button
4. Toast should show: "Form schema saved for 'Vehicles'"
5. Form builder closes

**Expected Result:**
- "Vehicles" category pill appears in filter bar on home page
- Hover over pill shows edit icon
- Form data saved in database

### Test 3: Create Vehicle Listing

**Steps:**
1. Click "Create Listing" or navigate to `/create-listing`
2. Fill standard fields:
   - Type: Select "Offering Services"
   - Category: Select "House" or "Hotel" (your choice)
   - Title: "2020 Toyota Camry - Daily Rental Available"
   - Location: "San Francisco, CA"
   - Start Date: Pick a date
   - End Date: Pick a date after start
   - Description: "Well-maintained vehicle in excellent condition"
3. Upload media: Click upload area and select some images
4. Scroll to "Custom Category" section
5. Select "Vehicles" from dropdown
6. "Vehicles Details" section appears with all 18 fields
7. Fill required fields:
   - Vehicle Type: Select "Car"
   - Make & Model: "Toyota Camry 2020"
   - Year: "2020"
   - Insurance: "Yes - Full Coverage"
   - Daily Rate: "50"
   - Security Deposit: "500"
   - Location: "San Francisco, CA"
   - Available From: (date)
   - Available Until: (date)
   - License Requirements: "Standard Driver's License"
   - Vehicle Description: "Excellent condition, 45k miles"
8. Fill optional fields:
   - Insurance Details: "Full coverage included"
   - Transmission: "Automatic"
   - Fuel Type: "Gasoline"
   - Passenger Capacity: "5"
   - Features: Check multiple amenities
9. Click "Submit" on form (validates without actually submitting form)
10. Click "Create Listing" button at bottom

**Expected Result:**
- Listing created successfully
- Redirected to listing detail page
- Vehicle form data displays below standard listing info
- All submitted values visible

### Test 4: Security Tests

**Test 4A: Non-Admin Cannot See Admin Features**
1. Logout as admin
2. Login as non-admin user (guest or host)
3. Navigate to home page
4. Verify "+ Add Category" button NOT visible
5. Create a new listing
6. Verify "Custom Category" section NOT visible
7. Verify form builder NOT accessible

**Test 4B: Category Name Validation**
1. Click "+ Add Category"
2. Try entering:
   - Empty name → Error: "Category name cannot be empty"
   - Name with >20 chars → Error: "must be 20 characters or less"
   - Name that exists → Error: "This category already exists"
   - Name with HTML tags "<script>" → Error: "invalid characters"
   - Valid name → Success

**Test 4C: Form Field Validation**
1. Create test listing with Vehicles category
2. Try submitting form with:
   - Empty required fields → Shows error under field
   - Year outside range → Shows error
   - Daily Rate as 0 → Error: "must be at least 1"
   - File upload >8 MB → Shows error
   - Invalid file type → Shows error
3. Fill all correctly and submit → Success

### Test 5: Data Verification

**Check database:**
```sql
-- List all categories
SELECT id, name, slug, created_by, created_at
FROM custom_categories
WHERE deleted_at IS NULL;

-- Check form schema for Vehicles
SELECT category_id, jsonb_array_length(fields) as field_count
FROM form_schemas
WHERE category_id = (SELECT id FROM custom_categories WHERE name = 'Vehicles');

-- Check vehicle listing form data
SELECT l.id, l.title, lfd.form_data
FROM listings l
LEFT JOIN listing_form_data lfd ON l.form_data_id = lfd.id
WHERE l.custom_category_id = (SELECT id FROM custom_categories WHERE name = 'Vehicles');
```

### Test 6: Edge Cases

**Test 6A: Max Fields**
1. Try adding 100+ fields to form
2. Form should still save and load
3. Rendering may be slow but should work

**Test 6B: Long Values**
1. Create Vehicles category
2. In "Vehicle Description" field (max 800):
   - Fill with exactly 800 chars → Success
   - Try pasting 801 chars → Character limited (UI prevents)
   - Count shows "800/800" → Correct

**Test 6C: Special Characters**
1. Category name: "Vehicles & Equipment" → Success (& is safe)
2. Category name: "O'Reilly Rentals" → Success (apostrophe is safe)
3. Vehicle description with: quotes, special chars → Success

**Test 6D: File Upload Scenarios**
1. Select 10 files when max=8 → Only 8 uploaded
2. Select .exe file in image upload → Rejected (MIME type check)
3. Select 15 MB image → Rejected (>max)
4. Select valid 2MB image → Success

### Test 7: UI/UX

**Test 7A: Form Builder UI**
1. Add 20 fields
2. Scroll through list → Smooth
3. Expand/collapse fields → Works
4. Click "Show Preview" → Live preview updates
5. Delete field from middle → Renumbering works
6. Mobile viewport (<768px) → Form builder still accessible

**Test 7B: Category Pill Behavior**
1. Home page with custom categories shows pills
2. Hover over pill → Edit icon appears
3. Click edit icon → Form builder opens
4. Non-admin user → No edit icon shown
5. Mobile → Pill layout responsive

**Test 7C: Toast Notifications**
1. Create category → Toast appears for 3 seconds
2. Save form → Toast appears for 3 seconds
3. Multiple toasts → Only latest shown
4. Network error → Error toast appears

## Troubleshooting Tests

### Issue: Category not appearing after creation

**Debug Steps:**
1. Check browser console for errors
2. Verify user is admin (`profile.role === 'admin'`)
3. Check database for category record:
   ```sql
   SELECT * FROM custom_categories WHERE name = 'Vehicles';
   ```
4. Check `deleted_at` is NULL
5. Refresh page - should appear

### Issue: Form fields not rendering

**Debug Steps:**
1. Check form_schemas table has record:
   ```sql
   SELECT * FROM form_schemas
   WHERE category_id = (SELECT id FROM custom_categories WHERE name = 'Vehicles');
   ```
2. Verify `fields` column has valid JSON array
3. Check each field has `id`, `type`, `label`
4. Try deleting and recreating form

### Issue: Custom form data not saving with listing

**Debug Steps:**
1. Check `listing_form_data` table for record:
   ```sql
   SELECT * FROM listing_form_data
   WHERE listing_id = '<listing-id>';
   ```
2. Verify listing has `form_data_id` set
3. Check form validation passed (no errors shown)
4. Check network tab for errors during submission
5. Verify user is owner of listing

## Performance Benchmarks

### Expected Performance

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Load categories list | <100ms | <1000 categories |
| Load form schema | <50ms | Indexed query |
| Create category | 200-500ms | Includes validation |
| Save form schema | 300-600ms | JSON serialization |
| Render 18-field form | 50ms | React rendering |
| Submit listing with custom form | 1-2s | Media upload timing varies |

### Load Testing Recommendations

- Test with 100+ categories
- Test with 50+ field forms
- Test with 10MB file uploads
- Test with 100+ concurrent users viewing categories
- Monitor database query times

## Cleanup After Testing

To remove test data:

```sql
-- Delete test vehicle listings
DELETE FROM listings WHERE custom_category_id = (SELECT id FROM custom_categories WHERE name = 'Vehicles');

-- Delete form data
DELETE FROM listing_form_data WHERE category_id = (SELECT id FROM custom_categories WHERE name = 'Vehicles');

-- Delete form schema
DELETE FROM form_schemas WHERE category_id = (SELECT id FROM custom_categories WHERE name = 'Vehicles');

-- Delete category (soft delete)
UPDATE custom_categories SET deleted_at = now() WHERE name = 'Vehicles';

-- Or hard delete
DELETE FROM custom_categories WHERE name = 'Vehicles';
```

## Sign-off Checklist

- [ ] All 18 Vehicle fields created and configured
- [ ] Form preview shows all fields correctly
- [ ] Form schema saved successfully
- [ ] Vehicle listing created with all custom form data
- [ ] Non-admin user cannot access admin features
- [ ] All validations working as expected
- [ ] Data persisted correctly in database
- [ ] UI/UX responsive on mobile
- [ ] Error handling and toast notifications working
- [ ] Special characters and edge cases handled
- [ ] Performance acceptable with test data volume
