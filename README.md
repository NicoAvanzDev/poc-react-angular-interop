# 🧩 Microfrontend Architecture: React Host + Angular Remote

This document describes how a **React application (Vite-based)** integrates an **Angular standalone application** as a remote Microfrontend using **Webpack Module Federation** and **Web Components**.

---

## 🧱 Architecture Overview

```
┌────────────────────────────┐
│ React Host (Vite + React)  │
│                            │
│ <angular-app></angular-app> ← Web Component from Angular
│                            │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ Angular Remote (Standalone)│
│                            │
│ remoteEntry.js via Module  │
│ Federation + Web Component │
└────────────────────────────┘
```

---

## ⚙️ Key Technologies

| Layer             | Technology                           |
| ----------------- | ------------------------------------ |
| Host              | React + Vite                         |
| Remote            | Angular (Standalone)                 |
| Integration       | Web Components (`@angular/elements`) |
| Sharing Mechanism | Webpack Module Federation            |
| Loader Runtime    | Dynamic ES Module loading            |

---

## 🔄 How It Works

### 1. Angular Exposes a Web Component

- In Angular's `bootstrap.ts`, a standalone component (`App`) is wrapped as a **Web Component**:

```ts
import { createCustomElement } from "@angular/elements";

customElements.define("angular-app", createCustomElement(App, { injector }));
```

- Angular's `webpack.config.js` exposes this file via:

```js
exposes: {
  './RemoteElement': './src/bootstrap.ts'
}
```

- This generates `remoteEntry.js`, which the React host can load.

---

### 2. React Host Loads Angular Remote Dynamically

```tsx
useEffect(() => {
  import("remoteAngular/RemoteElement").then(() =>
    console.log("✅ Angular loaded")
  );
}, []);

return <angular-app />;
```

- `import('remoteAngular/RemoteElement')` loads Angular’s `remoteEntry.js` and registers the custom element.
- React renders `<angular-app />` like a normal HTML tag.
- Angular renders inside that DOM element independently.

---

### 3. Angular App Renders Inside `<angular-app>`

- Angular is bootstrapped using `createApplication()`:

```ts
createApplication({
  providers: [importProvidersFrom(BrowserModule)],
});
```

- The component is fully isolated: styles, template, and change detection all run independently from React.

---

## ✅ Benefits

- **Framework Agnostic**: Any host (React, Vue, Svelte) can consume Angular Web Components.
- **Independent Deployment**: Remotes and host apps can be deployed and updated separately.
- **Lazy Loaded**: Angular app is loaded only when needed.
- **Scalable**: You can add more remotes or replace them without changing the host.
- **Efficient Development**: Turborepo provides:
  - **Parallel execution**: Run multiple apps simultaneously during development
  - **Smart caching**: Avoid rebuilding unchanged code
  - **Task orchestration**: Automatically handle build dependencies (Angular builds before React)
  - **Selective builds**: Build only the apps you're working on

---

## � Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v10 or higher)

### Installation & Build

This project uses **Turborepo** for monorepo management and orchestration.

```bash
# Install dependencies for all apps
npm install

# Build all applications
npm run build

# Run all applications in development mode
npm run dev
```

### Individual App Commands

You can also run commands for specific applications:

```bash
# Build only the React host
npx turbo run build --filter=host-react

# Build only the Angular remote
npx turbo run build --filter=remote-angular

# Run only the React host in dev mode
npx turbo run dev --filter=host-react

# Run only the Angular remote in dev mode
npx turbo run dev --filter=remote-angular
```

### Development Workflow

**Option 1: Sequential Start (Recommended for Module Federation)**

```bash
# Start Angular remote first, then React host waits for it to be ready
npm run dev:sequential
```

**Option 2: Parallel Start (Faster but may have timing issues)**

```bash
# Start both apps simultaneously
npm run dev
```

**Option 3: Manual Control**

```bash
# Start Angular remote first
npm run dev:remote

# In another terminal, start React host (it will wait for Angular to be ready)
npm run dev:host
```

### How the Sequential Start Works

1. **Angular Remote starts first**: Runs on `http://localhost:4201`
2. **React Host waits**: Uses `wait-on` to check if Angular is ready
3. **React Host starts**: Only after Angular's `remoteEntry.js` is available
4. **Both apps running**: React on `http://localhost:5173`, Angular on `http://localhost:4201`

### Build Process

**Build for production**: `npm run build`

- Turborepo will build Angular first (dependency), then React host
- Output files will be in respective `dist/` directories

---

## �📂 Project Structure

```
microfrontend/
├── package.json            # Root package.json with Turborepo scripts
├── turbo.json             # Turborepo configuration
├── apps/                  # Contains all applications
│   ├── host-react/         # React Host Application
│   │   ├── package.json    # React app dependencies
│   │   ├── index.html       # Main HTML file
│   │   ├── src/             # React source code
│   │   │   ├── main.jsx      # React entry point
│   │   │   ├── App.jsx        # Main React component
│   │   └── vite.config.ts    # Vite configuration with Module Federation
│   └── remote-angular/      # Angular Remote Application
│       ├── package.json      # Angular app dependencies
│       ├── src/              # Angular source code
│       │   ├── app.ts         # Standalone Angular component
│       │   ├── bootstrap.ts    # Web Component registration
│       ├── angular.json        # Angular project configuration
│       ├── tsconfig.json       # TypeScript configuration
│       └── webpack.config.js   # Webpack configuration for Module Federation
├── node_modules/          # Node.js dependencies
├── .gitignore              # Git ignore file
├── README.md               # Project documentation
└── .vscode/                # VSCode settings (optional)
    └── settings.json       # VSCode workspace settings
```

---

## 🔌 Module Federation Config Summary

### React (host) `vite.config.ts`

```ts
federation({
  remotes: {
    remoteAngular: "http://localhost:4201/remoteEntry.js",
  },
  shared: ["react", "react-dom"],
});
```

### Angular (remote) `webpack.config.js`

```js
exposes: {
  './RemoteElement': './src/bootstrap.ts',
}
```

---

## 🔍 Debug Tips

- `<angular-app>` must be in the DOM
- Console should show:
  ```
  ✅ Angular remote loaded
  ✅ Angular Web Component registered
  ```
- If content is invisible:
  - Ensure `BrowserModule` is provided
  - Ensure template is not empty

### Common Issues

- **React host starts before Angular remote is ready**:
  - **Solution**: Use `npm run dev:sequential` instead of `npm run dev`
  - This ensures Angular compiles and starts before React tries to connect
- **Module Federation errors or "Loading chunk failed"**:

  - **Cause**: React host tries to load Angular remote before it's ready
  - **Solution**: Use the sequential startup or manually start Angular first
  - Check that `remoteEntry.js` is accessible at `http://localhost:4201/remoteEntry.js`

- **Only React app starts with `npm run dev`**:
  - Ensure all apps have a `dev` script in their package.json
  - Angular apps typically use `start` instead of `dev` by default
- **Port conflicts**:

  - React (Vite): `http://localhost:5173`
  - Angular: `http://localhost:4201`
  - Make sure these ports are available

- **"wait-on" command not found**:
  - Run `npm install` in the root to ensure all dependencies are installed
  - The `wait-on` package should be installed in the React host app

---

## 📌 Example Minimal Angular Component

```ts
@Component({
  standalone: true,
  selector: "ignored-root",
  template: `<h1>{{ title() }}</h1>`,
})
export class App {
  protected readonly title = signal("Hello from Angular");
}
```
