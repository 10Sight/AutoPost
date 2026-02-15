import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from "react-redux";
import { store } from "./app/store";
import { Toaster } from "sonner";
import { SocketProvider } from "./context/SocketProvider";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <SocketProvider>
        <App />
        <Toaster richColors position="top-right" />
      </SocketProvider>
    </Provider>
  </StrictMode>,
)
