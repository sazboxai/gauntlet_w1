# ChatGenius

ChatGenius is a modern, real-time chat application that provides seamless communication through direct messages and channels. Similar to platforms like Slack or Discord, it offers rich messaging features, file sharing, and social interactions.

## Features

### Authentication
- User registration and login
- Persistent sessions via Supabase
- Profile management

### Messaging
- Real-time direct messaging between users
- Channel-based group conversations
- Threaded replies for organized discussions
- Message reactions with emojis

### File Sharing
- Drag-and-drop file uploads
- File previews for images, PDFs, and videos
- Comprehensive file search and filtering
- File management (download, delete)

### User Experience
- Real-time typing indicators
- Online/offline user status
- Unread message indicators
- Mobile-responsive design

## Technologies Used

- **Frontend**: Next.js 14, React 18
- **Backend**: Supabase (Authentication, Database, Storage)
- **UI Components**: shadcn/ui based on Radix UI
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chatgenius.git
   cd chatgenius
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure 

├── app/ # Next.js app router
│ ├── api/ # API routes
│ ├── globals.css # Global styles
│ ├── layout.tsx # Root layout
│ └── page.tsx # Home page
├── components/ # React components
│ ├── ui/ # UI components
│ ├── AuthProvider.tsx # Authentication context
│ ├── ChannelList.tsx # Channel management
│ └── ... # Other components
├── lib/ # Utility functions
│ ├── supabase.ts # Supabase client and functions
│ └── utils.ts # Helper utilities
├── hooks/ # Custom React hooks
├── public/ # Static assets
└── supabase/ # Supabase migrations



## Database Setup
This project uses Supabase for database management. The database schema can be set up using the migration files located in the `supabase/migrations` directory.

1. Run migrations:
   ```bash
   npx supabase migration up
   ```

## Deployment

The application can be deployed to platforms like Vercel or Netlify:

```bash
npm run build
or
yarn build
```







