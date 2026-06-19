# AfroEduGo 🌍

AfroEduGo is a premium, high-fidelity web application designed as a global student hub to simplify the relocation process for international students moving to Europe (specifically focused on Lithuania). It helps students discover affordable universities, search for verified student housing, connect with peers through a community forum, book professional relocation services, and chat in real-time.

---

## 🚀 Key Features

### 1. 🎓 Global School Finder
* **Map & List Views**: Dynamic dual-view integrating Google Maps API to pin university coordinates.
* **Smart Filtering**: Filter by location, tuition fee budgets, and academic courses.
* **Intelligent Query Matching**: Built-in natural language parser to identify country or budget keywords in free-text search queries.
* **Autocomplete Search**: Integrated with Google Places API for address and campus searching.
* **Enrollment Management**: Students can directly submit inquiries/leads to the university database.
* **Launch Control**: Renders verified Lithuanian partners with "Coming Soon" splash screens and WhatsApp reminders for other European regions.

### 2. 🏠 Housing Finder
* **Property Search**: Find student rooms, apartments, and shared dorms.
* **Interactive Map**: View listings pinned geographically.
* **Direct Communication**: Message hosts directly through internal chat threads or quick-launch WhatsApp links.
* **Amenities Directory**: Details regarding high-speed Wi-Fi, furnishings, private showers, and utilities inclusion.

### 3. 💬 Real-Time Chat & Alerts
* **In-App Messaging**: Real-time peer-to-peer student chat and student-to-host chat.
* **System Alerts**: Instant notification center notifying users when admins update inquiry states or flag comments.

### 4. 👥 Community Forum
* **Categorized Boards**: Dedicated channels for General Discussion, Visa Help, and Housing Tips.
* **Rich Media**: Supports attaching and rendering images (uploaded directly to Firebase Storage).
* **Likes & Thread Replies**: Fully nested comment system with reaction counters.
* **Role-Based Badging**: Displays badges distinguishing **Incoming Students** from **Current Students** to foster mentorship.

### 5. 💼 Relocation Services Marketplace
* **Verified Vendors**: Direct consultation booking for visa support, student health insurance, and document translation.
* **Consultation Booking**: Direct-to-consultant WhatsApp launch links.

### 6. 🛡️ Control Room (Admin Dashboard)
* **Lead Tracking**: View and manage all school and housing inquiries. Administrators can mark statuses (e.g. *Processing*, *Done*) and chat with the student directly on WhatsApp.
* **Forum Moderation**: Review active community posts and moderate content directly by deleting flagged items.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router layout configuration)
* **Styling**: [TailwindCSS 3](https://tailwindcss.com/) for fluid glassmorphism, responsive navigation grids, and smooth animations
* **Database / Backend**: [Firebase 12](https://firebase.google.com/) (Firestore with offline persistence enabled, Storage, Auth)
* **Mobile / Offline**: [@ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa) for Progressive Web App features
* **Mapping**: [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) and [use-places-autocomplete](https://www.npmjs.com/package/use-places-autocomplete)

---

## 📁 Directory Structure

```text
├── public/                 # Static assets and PWA icons
├── src/
│   ├── app/                # Next.js App Router (Layouts & Route segments)
│   │   ├── add-listing/    # Property addition page
│   │   ├── admin/          # Admin Control Room router
│   │   ├── auth/           # Login & Registration route
│   │   ├── chat/           # Personal conversations page
│   │   ├── community/      # Forum page
│   │   ├── housing/        # Property Finder listing & dynamic detail routes
│   │   ├── schools/        # School Finder route
│   │   └── services/       # Services Marketplace route
│   ├── components/         # Reusable UI widgets (Map, Inquiry Modals, Comments)
│   ├── context/            # React global context providers
│   ├── firebase/           # Configuration and database seeding/migration scripts
│   ├── hooks/              # Custom React hooks (Auth, Firestore listeners, Notifications)
│   ├── screens/            # Main screen components imported by the app router
│   ├── utils/              # Helper utilities (WhatsApp URL generators)
│   └── index.css           # Global CSS variables and core Tailwind setup
```

---

## ⚙️ Local Setup & Configuration

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
* A Firebase Project configured with Firestore Database, Firebase Storage, and Email/Google Auth.
* A Google Maps API key (with Directions API and Places API enabled).

### 1. Environment Variables
Create a `.env.local` file at the root of the project with the following configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional Integrations
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your_tiktok_client_key
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=http://localhost:3000
```

### 2. Install Dependencies
Run one of the following commands depending on your package manager:
```bash
npm install
# or
bun install
```

### 3. Run Development Server
```bash
npm run dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Build for Production
To build the static next bundle:
```bash
npm run build
```

---

## 🌐 Deployment

The project is preconfigured for **Firebase Hosting** / **Firebase App Hosting**:
* `firebase.json` details target rewrites.
* `apphosting.yaml` configures Firebase App Hosting environments.
* `.github/workflows/` contains continuous integration scripts for deployment.
