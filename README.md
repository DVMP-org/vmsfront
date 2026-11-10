# VMSCORE Frontend

Current product contracts and task loading: [project reference index](../vmscore/project-plans/README.md).
Read the current ledger there before treating this setup overview as delivery status.

A modern, responsive dashboard application for the VMSCORE visitor and resident access management system. Built with Next.js, TypeScript, Tailwind CSS, and React Query.

## Features

- 🔐 **Authentication**: Secure login and registration
- 🏠 **Multi-Dashboard**: Separate dashboards for residents and admins
- 🎫 **Pass Management**: Create and manage visitor passes
- 🚪 **Gate Console**: Real-time gate verification and check-in/out
- 📊 **Analytics**: Insights and statistics (coming soon)
- 🎨 **Branding**: Customizable colors and themes via CSS variables
- 📱 **Responsive**: Mobile-first design that works on all devices
- ⚡ **Real-time**: Polling-based updates with WebSocket support planned

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running at `http://localhost:8080`

### Installation

1. **Clone the repository** (if not already in the project):
   ```bash
   cd vmsfront
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   
   Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Update the values in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://vmscore.to
   NEXT_PUBLIC_APP_NAME=VMSCORE
   NEXT_PUBLIC_WS_URL=wss://vmscore.to
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
vmsfront/
├── src/
│   ├── app/                  # Next.js app router pages
│   │   ├── admin/           # Admin dashboard routes
│   │   ├── resident/        # Resident dashboard routes
│   │   ├── auth/            # Authentication pages
│   │   └── select/          # Dashboard selection page
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── services/            # API service layer
│   ├── store/               # Zustand state stores
│   ├── types/               # TypeScript type definitions
│   └── test/                # Test files
├── public/                  # Static assets
└── package.json
```

## Key Features

### Authentication
- Login and registration pages
- JWT-based authentication
- Automatic token refresh
- Protected routes

### Resident Dashboard
- View residency information
- Create and manage visitor passes
- Track gate events
- View visitor history
- QR code generation for passes

### Admin Dashboard
- Manage residencies and residents
- Gate console for check-in/out
- View analytics and reports
- Role-based access control
- Real-time presence tracking

## API Integration

The frontend integrates with the VMSCORE backend API. All API calls are made through service layers:

- **Auth Service**: `/src/services/auth-service.ts`
- **Resident Service**: `/src/services/resident-service.ts`
- **Admin Service**: `/src/services/admin-service.ts`

API client configuration is in `/src/lib/api-client.ts`.

## Customization

### Branding

The application supports branding customization through CSS variables. Update the colors in `/src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... other variables */
}
```

### App Name

Change the app name in `.env.local`:
```env
NEXT_PUBLIC_APP_NAME=Your Brand Name
```

## Testing

Run tests with:
```bash
npm run test
# or
yarn test
```

The project uses Vitest for unit testing and React Testing Library for component testing.

### Smoke Tests

Key user flows covered:
1. Login flow
2. Dashboard selection
3. Pass creation
4. Gate verification

## Building for Production

1. **Build the application**:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Start the production server**:
   ```bash
   npm start
   # or
   yarn start
   ```

The production build is optimized with:
- Server-side rendering (SSR)
- Static generation where possible
- Automatic code splitting
- Image optimization

## Environment Variables

| Variable               | Description            | Default                 |
| ---------------------- | ---------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API base URL   | `https://vmscore.to` |
| `NEXT_PUBLIC_APP_NAME` | Application name       | `VMSCORE`               |
| `NEXT_PUBLIC_WS_URL`   | WebSocket URL (future) | `wss://vmscore.to`      |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables
4. Deploy

### Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t vmsfront .
docker run -p 3000:3000 vmsfront
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

This project is part of the VMSCORE system.

## Support

For issues and questions, please refer to the main VMSCORE documentation or contact the development team.

## Roadmap

- [ ] WebSocket/SSE for real-time updates
- [ ] Advanced analytics with charts
- [ ] Push notifications
- [ ] Offline support
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Export reports (PDF/CSV)

