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

| Layer             | Technology                     |
|------------------|---------------------------------|
| Host             | React + Vite                    |
| Remote           | Angular (Standalone)            |
| Integration      | Web Components (`@angular/elements`) |
| Sharing Mechanism| Webpack Module Federation       |
| Loader Runtime   | Dynamic ES Module loading       |

---

## 🔄 How It Works

### 1. Angular Exposes a Web Component

- In Angular's `bootstrap.ts`, a standalone component (`App`) is wrapped as a **Web Component**:

```ts
import { createCustomElement } from '@angular/elements';

customElements.define('angular-app', createCustomElement(App, { injector }));
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
  import('remoteAngular/RemoteElement')
    .then(() => console.log('✅ Angular loaded'));
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
  providers: [importProvidersFrom(BrowserModule)]
})
```

- The component is fully isolated: styles, template, and change detection all run independently from React.

---

## ✅ Benefits

- **Framework Agnostic**: Any host (React, Vue, Svelte) can consume Angular Web Components.
- **Independent Deployment**: Remotes and host apps can be deployed and updated separately.
- **Lazy Loaded**: Angular app is loaded only when needed.
- **Scalable**: You can add more remotes or replace them without changing the host.

---

## 📂 Project Structure

```
microfrontend/
├── host-react/             # React + Vite
│   └── vite.config.ts      # Defines remotes via federation plugin
│   └── App.jsx             # Renders <angular-app>
├── remote-angular/         # Angular App
│   └── bootstrap.ts        # Registers Angular Web Component
│   └── app.ts              # Standalone Component
│   └── webpack.config.js   # Module Federation setup
```

---

## 🔌 Module Federation Config Summary

### React (host) `vite.config.ts`

```ts
federation({
  remotes: {
    remoteAngular: 'http://localhost:4201/remoteEntry.js',
  },
  shared: ['react', 'react-dom'],
})
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

---

## 📌 Example Minimal Angular Component

```ts
@Component({
  standalone: true,
  selector: 'ignored-root',
  template: `<h1>{{ title() }}</h1>`,
})
export class App {
  protected readonly title = signal('Hello from Angular');
}
```
