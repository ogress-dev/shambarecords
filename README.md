# Crop Field Monitoring

A field monitoring application for tracking crop progress through growing seasons, built with Next.js (App Router) and PostgreSQL.

## What the Application Does

This application allows agricultural administrators to manage crop fields and assign them to field agents. Agents then track and update field progress throughout the growing season.

### User Roles

- **Admin**: Manages all fields, creates new fields, assigns fields to agents, and monitors all agent updates
- **Agent**: Views only assigned fields, updates field stages, adds notes/observations

### Workflow

1. **Login**: Users log in with email and password
2. **Dashboard**: 
   - Admins see all fields with status breakdown (Active/At Risk/Completed), can create fields, assign agents, view recent updates
   - Agents see only their assigned fields, can update field stages
3. **Field Status**: Automatically computed based on planting date and current stage:
   - `Completed`: Stage is "Harvested"
   - `At Risk`: More than 60 days since planting and stage is not "Ready"
   - `Active`: All other cases

## How the Code Works

### File Structure

```
app/
├── page.tsx                 # Login page
├── dashboard/page.tsx       # Main dashboard (admin & agent)
├── fields/new/page.tsx     # Create new field (admin only)
├── api/
│   ├── login/route.ts      # Authentication endpoint
│   ├── db.ts               # Database connection & initialization
│   ├── fields/
│   │   ├── route.ts        # Get all fields / create field (admin)
│   │   ├── assigned/route.ts  # Get fields assigned to agent
│   │   └── [id]/
│   │       ├── assign/route.ts  # Assign field to agent
│   │       └── update/route.ts  # Update field stage
│   ├── agents/route.ts    # Get all agents (for assignment dropdown)
│   └── updates/route.ts   # Get recent field updates (admin)
```

### Authentication

1. `app/page.tsx` collects email/password
2. Sends POST to `/api/login`
3. `app/api/login/route.ts` validates against `users` table
4. On success, returns user object (id, email, role, name) stored in localStorage
5. Dashboard reads from localStorage to determine role and display name

### Database

The app uses PostgreSQL with the `pg` library. The database is automatically initialized on first connection:

**Tables:**
- `users`: id, email, password, role, name
- `fields`: id, name, crop_type, planting_date, current_stage, assigned_agent_id, created_by
- `field_updates`: id, field_id, agent_id, new_stage, notes, created_at

### API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/login` | POST | Public | Authenticate user |
| `/api/fields` | GET | Admin | Get all fields |
| `/api/fields` | POST | Admin | Create new field |
| `/api/fields/assigned` | GET | Agent | Get assigned fields |
| `/api/fields/[id]/assign` | PUT | Admin | Assign field to agent |
| `/api/fields/[id]/update` | POST | Agent | Update field stage |
| `/api/agents` | GET | Admin | Get all agents |
| `/api/updates` | GET | Admin | Get recent updates |

### Security

- Role checks are performed server-side in each API route
- Admin-only endpoints verify `x-role` header is "admin"
- Agent-only endpoints verify `x-role` header is "agent"
- User ID is passed via `x-user-id` header to associate actions with the correct user

### Session Management

Login state is stored in localStorage as JSON:
```json
{ "id": 1, "email": "admin@example.com", "role": "admin", "name": "Admin User" }
```

The dashboard checks for this on load and redirects to login if not present.

## Demo Credentials

- **Admin**: admin@example.com / admin123 (name: "Admin User")
- **Agent**: agent@example.com / agent123 (name: "Agent User")
- **Agent 1**: agent1@example.com / agent123 (name: "Agent One")
- **Agent 2**: agent2@example.com / agent123 (name: "Agent Two")
- **Agent 3**: agent3@example.com / agent123 (name: "Agent Three")

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create PostgreSQL database:
   ```sql
   CREATE DATABASE crop_monitoring;
   ```

3. Configure environment variables in `.env.local`:
   ```env
   # Either use DATABASE_URL
   DATABASE_URL=postgresql://user:password@localhost:5432/crop_monitoring
   
   # Or configure individually
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_password
   PGDATABASE=crop_monitoring
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

The database tables and demo users are created automatically on first connection.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL with `pg` library
- **Styling**: Inline CSS (kept minimal for clarity)