import { Component } from "react";

// Keeps a rendering bug from blanking the whole page and shows a way back instead.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Jasusha Lab render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container section empty-page" role="alert">
        <h1>Бетте қате шықты</h1>
        <p className="lead">Бетті жаңартып көріңіз. Қате қайталанса, мұғалімге хабарлаңыз.</p>
        <pre className="error-detail">{String(this.state.error?.message || this.state.error)}</pre>
        <a className="btn primary" href="/">Басты бетке</a>
      </div>
    );
  }
}
