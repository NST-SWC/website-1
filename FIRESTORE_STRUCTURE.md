# 🔥 Firestore Database Structure

## Collections Overview

Your Firebase project has 5 main collections:

### 1. **members** - Club Members/Users
Stores all registered members of the dev club.

**Schema:**
```typescript
{
  id: string;              // Auto-generated document ID
  name: string;            // Full name
  email: string;           // Email address
  role: "admin" | "student"; // User role
  avatar: string;          // Profile picture URL
  points: number;          // Gamification points
  badges: number;          // Number of badges earned
  createdAt: Timestamp;    // When joined
  updatedAt: Timestamp;    // Last profile update
}
```

**API Endpoints:**
- `GET /api/members` - Fetch all members
- `POST /api/members` - Create or update member

---

### 2. **projects** - All Projects
Stores all club projects (current, recruiting, completed).

**Schema:**
```typescript
{
  id: string;              // Auto-generated document ID
  title: string;           // Project name
  description: string;     // Project description
  tech: string[];          // Tech stack array
  status: "active" | "recruiting" | "waitlist";
  owner: string;           // Owner name (display)
  ownerId: string;         // Owner's member ID (for permissions)
  members: number;         // Number of team members
  createdAt: Timestamp;    // When created
  updatedAt: Timestamp;    // Last updated
}
```

**API Endpoints:**
- `GET /api/projects` - Fetch all projects
- `POST /api/projects` - Create new project

---

### 3. **projectInterests** - Join Requests for Projects
When users click "Request to join" on a project.

**Schema:**
```typescript
{
  id: string;              // Auto-generated document ID
  projectId: string;       // Which project they want to join
  userId: string;          // Who wants to join
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;    // When requested
  updatedAt: Timestamp;    // When status changed
  decidedAt: Timestamp | null; // When approved/rejected
}
```

**API Endpoints:**
- `POST /api/project-interest` - Create join request
- `GET /api/project-interests?projectId=X&status=pending` - Fetch requests
- `PATCH /api/project-interests` - Approve/reject request

---

### 4. **adminDecisions** - Club Membership Decisions
When admins approve/hold club membership applications.

**Schema:**
```typescript
{
  id: string;              // Auto-generated document ID
  requestId: string;       // ID of the join request
  decision: "approve" | "hold";
  actedAt: Timestamp;      // When decision was made
}
```

**API Endpoints:**
- `POST /api/admin/decision` - Record admin decision

---

### 5. **interestedParticipants** - Approved Project Members
Tracks who has been approved to join which projects.

**Schema:**
```typescript
{
  id: string;              // Auto-generated document ID
  projectId: string;       // Which project
  userId: string;          // Which member
  joinedAt: Timestamp;     // When they joined
}
```

**Auto-populated when:**
- Admin approves a `projectInterests` request
- Status changes from `pending` → `approved`

---

## Data Flow Examples

### Example 1: User Joins a Project

1. **User clicks "Request to join"** on Dev Club Portal
   ```
   POST /api/project-interest
   {
     projectId: "geetansh-project",
     userId: "utsav-1"
   }
   ```

2. **Creates document in `projectInterests`:**
   ```
   {
     id: "IKww8RRmiWqJYLevqYnj",
     projectId: "geetansh-project",
     userId: "utsav-1",
     status: "pending",
     createdAt: [Timestamp]
   }
   ```

3. **Project owner (Geetansh) goes to Manage Project:**
   ```
   GET /api/project-interests?projectId=geetansh-project&status=pending
   ```
   Returns all pending requests for this project

4. **Owner clicks "Approve":**
   ```
   PATCH /api/project-interests
   {
     interestId: "IKww8RRmiWqJYLevqYnj",
     status: "approved",
     projectId: "geetansh-project",
     userId: "utsav-1"
   }
   ```

5. **Two things happen:**
   - Updates `projectInterests` document → `status: "approved"`
   - Creates document in `interestedParticipants`:
     ```
     {
       projectId: "geetansh-project",
       userId: "utsav-1",
       joinedAt: [Timestamp]
     }
     ```

---

### Example 2: User Creates a Project

1. **User fills create project form and submits:**
   ```
   POST /api/projects
   {
     title: "AI Study Companion",
     description: "...",
     tech: ["React", "Python", "OpenAI"],
     status: "recruiting",
     owner: "Geetansh Goyal",
     ownerId: "geetansh-1"
   }
   ```

2. **Creates document in `projects`:**
   ```
   {
     id: "auto-generated-id",
     title: "AI Study Companion",
     description: "...",
     tech: ["React", "Python", "OpenAI"],
     status: "recruiting",
     owner: "Geetansh Goyal",
     ownerId: "geetansh-1",
     members: 1,
     createdAt: [Timestamp],
     updatedAt: [Timestamp]
   }
   ```

3. **Project now appears on `/projects` page**

---

## Security Rules (Firestore)

Current rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Members - read all, write own
    match /members/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects - read all, create if authenticated
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Project Interests - read own or if project owner
    match /projectInterests/{interestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null; // For approval
    }
    
    // Admin Decisions - admin only
    match /adminDecisions/{decisionId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Interested Participants - read all
    match /interestedParticipants/{participantId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

---

## Current Data (as shown in screenshot)

**✅ Your Firestore already has:**
- `projectInterests` collection with 7 documents
- One example shown: `IKww8RRmiWqJYLevqYnj`
  - `createdAt`: November 10, 2025
  - `projectId`: "ai-playground"
  - `userId`: "admin-1"

---

## Testing the Integration

### 1. Test Project Creation:
```bash
# Login as any user
# Go to /projects
# Click "Create Project"
# Fill form and submit
# Check Firebase Console → projects collection
```

### 2. Test Join Request:
```bash
# Login as User A
# Go to /projects
# Click "Request to join" on someone else's project
# Check Firebase Console → projectInterests collection (should see new document)
```

### 3. Test Approval:
```bash
# Login as project owner
# Go to /dashboard/projects/{project-id}/manage
# Click "Approve" on pending request
# Check Firebase Console:
#   - projectInterests → status should be "approved"
#   - interestedParticipants → new document should exist
```

---

## API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/members` | GET | Fetch all members |
| `/api/members` | POST | Create/update member |
| `/api/projects` | GET | Fetch all projects |
| `/api/projects` | POST | Create project |
| `/api/project-interest` | POST | Request to join project |
| `/api/project-interests` | GET | Fetch join requests (with filters) |
| `/api/project-interests` | PATCH | Approve/reject request |
| `/api/admin/decision` | POST | Record admin decision |

---

## ✅ What's Working Now

- ✅ Project creation saves to Firestore
- ✅ Join requests save to Firestore
- ✅ Manage page fetches real data
- ✅ Approve/reject updates Firestore
- ✅ Auto-creates interestedParticipants on approval
- ✅ Demo mode fallback if Firestore fails

**All APIs work with your existing Firebase database!** 🎉
