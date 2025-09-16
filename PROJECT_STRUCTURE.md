# Project Structure

Clean, modern architecture after React + Vite conversion and cleanup.

## 📁 Directory Overview

```
sse-demo/
├── 🦀 Backend (Rust)
│   ├── src/
│   │   ├── main.rs              # Main server, SSE endpoints, static serving
│   │   └── issues.rs            # Business logic, CloudEvents, JSON Merge Patch
│   ├── Cargo.toml               # Rust dependencies
│   └── Cargo.lock               # Dependency lock file
│
├── ⚛️  Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ConnectionStatus.tsx    # SSE connection indicator
│   │   │   ├── CloudEventsStream.tsx   # Real-time event display
│   │   │   ├── CreateIssueForm.tsx     # Issue creation form
│   │   │   ├── PatchIssueForm.tsx      # Issue update form
│   │   │   └── IssuesList.tsx          # Interactive issues list
│   │   ├── hooks/
│   │   │   └── useSSE.ts        # Custom SSE hook with state management
│   │   ├── App.tsx              # Main React component
│   │   ├── main.tsx             # React entry point
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── App.css              # Modern CSS with responsive design
│   │   └── vite-env.d.ts        # Vite type definitions
│   ├── public/
│   │   └── vite.svg             # Vite logo
│   ├── package.json             # Node.js dependencies
│   ├── vite.config.ts           # Vite config with API proxy
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tsconfig.app.json        # App-specific TypeScript config
│   ├── tsconfig.node.json       # Node.js TypeScript config
│   └── eslint.config.js         # ESLint configuration
│
├── 🚀 Build Output
│   └── dist/                    # Built React app (served by Rust in production)
│       ├── index.html
│       └── assets/
│
├── 🛠️  Development Tools
│   ├── build.sh                 # Production build script
│   ├── dev.sh                   # Development workflow script
│   └── test-api.sh              # API testing script
│
├── 📚 Documentation
│   ├── README.md                # Main documentation with React instructions
│   ├── REACT_CONVERSION.md      # Detailed conversion summary
│   ├── CLEANUP_SUMMARY.md       # Files removed and cleanup details
│   └── PROJECT_STRUCTURE.md     # This file
│
├── ⚙️  Configuration
│   ├── .gitignore               # Git ignore patterns (Rust + Node.js)
│   ├── .github/                 # GitHub workflows (if any)
│   └── .shuttle/                # Shuttle deployment config
│
└── 🗂️  Generated/Cache
    └── target/                  # Rust build artifacts (gitignored)
```

## 🔧 Key Files Explained

### Backend (Rust)
- **`src/main.rs`** - Axum server with SSE endpoints, CloudEvents processing, and static file serving
- **`src/issues.rs`** - Business logic for issue management and CloudEvents generation

### Frontend (React)
- **`src/App.tsx`** - Main component orchestrating all functionality
- **`src/hooks/useSSE.ts`** - Custom hook managing SSE connection and real-time state
- **`src/components/`** - Modular React components for different UI sections
- **`src/types.ts`** - TypeScript interfaces for CloudEvents and Issues

### Development
- **`dev.sh`** - Development workflow automation (start dev servers, build, test)
- **`vite.config.ts`** - Vite configuration with API proxy to Rust backend

## 🌊 Data Flow

```
Browser ←→ React App (localhost:5173) ←→ Vite Proxy ←→ Rust API (localhost:3000)
                ↓                                              ↓
           React Components                              CloudEvents + SSE
                ↓                                              ↓
            useSSE Hook ←←←←←←←← Server-Sent Events ←←←←← Event Storage
```

## 🚀 Development Modes

### Development Mode (Recommended)
- **React**: `http://localhost:5173` (Vite dev server with HMR)
- **API**: `http://localhost:3000` (Rust backend, proxied by Vite)
- **Start**: `./dev.sh dev`

### Production Mode
- **Full App**: `http://localhost:3000` (Rust serving React build + API)
- **Start**: `./dev.sh prod`

## 📊 Line Count Summary

| Component | Files | Lines | Description |
|-----------|-------|-------|-------------|
| **Rust Backend** | 2 | ~680 | Server, SSE, business logic |
| **React Components** | 5 | ~800 | UI components with TypeScript |
| **React Hooks** | 1 | ~200 | SSE connection management |
| **Types & Config** | 4 | ~120 | TypeScript interfaces, configs |
| **Scripts & Docs** | 6 | ~500 | Build scripts, documentation |
| **Total** | 18 | ~2300 | Clean, maintainable codebase |

## 🎯 Architecture Benefits

### ✅ Separation of Concerns
- **Backend**: Pure API server with CloudEvents processing
- **Frontend**: React components with modern state management
- **Build**: Automated with Vite optimization

### ✅ Developer Experience
- **Hot Reloading**: Instant feedback during development
- **Type Safety**: Full TypeScript coverage
- **Modern Tooling**: ESLint, Prettier, React DevTools

### ✅ Production Ready
- **Single Binary**: Rust serves optimized React bundle
- **SSE Streaming**: Real-time updates with connection handling
- **Responsive Design**: Works on all devices

### ✅ Maintainable
- **Component Architecture**: Reusable, testable pieces
- **Custom Hooks**: Encapsulated SSE logic
- **Clear Structure**: Easy to understand and extend

This structure provides a solid foundation for a modern, scalable real-time web application using Server-Sent Events with CloudEvents specification.