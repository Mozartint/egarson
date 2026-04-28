import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('React Error Boundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ textAlign: 'center', color: '#fff', fontFamily: '-apple-system, sans-serif' }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Bir hata olustu</h2>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 20 }}>Lutfen sayfayi yenileyin</p>
            <button onClick={() => window.location.reload()}
              style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Sayfayi Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function hideLoader() {
  var loader = document.getElementById('app-loader');
  if (loader) loader.style.display = 'none';
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

hideLoader();
