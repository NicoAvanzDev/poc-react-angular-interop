import { useEffect } from "react";

function App() {
  useEffect(() => {
    import("remoteAngular/AngularApp")
      .then(() => console.log("✅ Angular remote loaded"))
      .catch((err) => console.error("❌ Failed to load Angular remote", err));
  }, []);

  return (
    <div>
      <h2>This is React</h2>
      <angular-app></angular-app>
    </div>
  );
}

export default App;
