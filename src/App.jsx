import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main">
        <Hero />
      </main>
    </>
  );
}
