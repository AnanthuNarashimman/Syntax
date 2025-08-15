# Skills and Languages Editing Feature

## Overview

This feature allows students to edit their programming languages and skills, which are then saved to Firebase. The feature includes both frontend and backend components.

## Features

### Frontend Components

1. **StudentUser.jsx** - Main profile page that displays:

   - Student information
   - Programming languages (dynamically loaded from Firebase)
   - Skills with progress bars
   - Edit button to open the modal

2. **SkillEditModal.jsx** - Modal component for editing:
   - Add/remove programming languages
   - Add/remove skills with proficiency levels (0-100%)
   - Save changes to Firebase

### Backend Endpoints

1. **GET /api/student/profile** - Fetches student profile data including languages and skills
2. **PUT /api/student/profile/skills** - Updates student's languages and skills

## Data Structure

### Languages

```javascript
languages: ["JavaScript", "Python", "Java", "C++"];
```

### Skills

```javascript
skills: [
  { skill: "Arrays", level: 85 },
  { skill: "Trees", level: 72 },
  { skill: "Graphs", level: 68 },
  { skill: "Dynamic Programming", level: 45 },
];
```

## How to Use

1. **Navigate to Student Profile**: Go to the student profile page
2. **Click Edit/Add Button**: Click the "Edit/Add" button in the skills section
3. **Add Languages**: Type a programming language and click "Add"
4. **Add Skills**: Type a skill name, set proficiency level (0-100%), and click "Add"
5. **Remove Items**: Click the "×" button next to any language or skill to remove it
6. **Save Changes**: Click "Save" to update the database
7. **Cancel**: Click "Cancel" to close without saving

## Technical Implementation

### Backend Changes

- Fixed Firebase Admin SDK usage in skills update endpoint
- Updated profile fetch endpoint to retrieve data from Firebase
- Added proper error handling and validation

### Frontend Changes

- Fixed loading state management in StudentUser component
- Updated SkillEditModal to use correct data structure
- Added dynamic language display from Firebase data
- Improved error handling with user-friendly messages

## Error Handling

- **Network Errors**: Shows error messages when API calls fail
- **Validation**: Prevents empty languages/skills from being added
- **Authentication**: Ensures only authenticated students can edit their profile
- **Loading States**: Shows loading spinner during API calls

## Security

- JWT token authentication required for all endpoints
- Students can only edit their own profile
- Input validation on both frontend and backend
- CORS protection enabled

## Testing

To test the feature:

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd syntax && npm run dev`
3. Login as a student
4. Navigate to the student profile page
5. Test adding/removing languages and skills
6. Verify changes are saved to Firebase

## Dependencies

### Backend

- firebase-admin
- express
- jsonwebtoken
- bcryptjs

### Frontend

- react
- recharts (for charts)
- lucide-react (for icons)

## Future Enhancements

- Skill level validation (ensure levels are between 0-100)
- Bulk import/export of skills
- Skill categories (e.g., Data Structures, Algorithms)
- Progress tracking over time
- Skill recommendations based on contest performance
