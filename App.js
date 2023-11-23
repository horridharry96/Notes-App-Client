import React from "react";

// NAVIGATOR
import AppNavigator from "./src/navigation/AppNavigator";

// CONTEXT
import { StateContextProvider } from "./src/context";

export default function App() {
  return (
    <StateContextProvider>
      <AppNavigator />
    </StateContextProvider>
  );
}
