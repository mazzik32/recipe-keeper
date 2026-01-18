"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Fade-in animation observer
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".fade-in").forEach((el) => {
      el.classList.add("opacity-0", "translate-y-8", "transition-all", "duration-1000", "ease-out");
      fadeObserver.observe(el);
    });

    // Sticky CTA observer
    const stickyObserver = new IntersectionObserver(
      (entries) => {
        const heroEntry = entries.find((e) => e.target === heroRef.current);
        const finalCtaEntry = entries.find(
          (e) => e.target === finalCtaRef.current
        );

        // We can't rely on finding both entries every time, so we need to track state more carefully
        // or just simpler logic: show if scrolled past hero AND not yet at final CTA.
        // But IntersectionObserver logic from the HTML was: !heroVisible && !finalCtaVisible

        // Let's rely on window scroll for simpler React implementation or maintain the observer logic if possible.
        // Re-implementing the exact logic from HTML:
      },
      { threshold: 0.1 }
    );

    // Simplified Sticky Logic for React
    const handleScroll = () => {
      const heroRect = heroRef.current?.getBoundingClientRect();
      const finalRect = finalCtaRef.current?.getBoundingClientRect();

      const heroVisible = heroRect && heroRect.bottom > 0;
      const finalVisible = finalRect && finalRect.top < window.innerHeight;

      if (!heroVisible && !finalVisible) {
        setIsStickyVisible(true);
      } else {
        setIsStickyVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      fadeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="font-sans text-warm-gray-600 bg-cream overflow-x-hidden text-lg leading-relaxed">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4 bg-cream/85 backdrop-blur-md border-b border-[rgba(93,83,77,0.08)]">
        <div className="max-w-[1200px] mx-auto px-[clamp(20px,5vw,40px)] flex items-center justify-between">
          <Link href="#" className="flex items-center gap-2.5 no-underline">
            <span className="text-[28px]">🍳</span>
            <span className="font-display text-[22px] font-semibold text-warm-gray-700">
              RecipeKeeper
            </span>
          </Link>
          <Link
            href="#start"
            className="inline-flex items-center justify-center font-semibold text-[17px] no-underline transition-all duration-300 rounded-full px-9 py-[18px] bg-peach-300 text-warm-gray-700 shadow-[0_4px_24px_rgba(248,168,136,0.35)] hover:bg-peach-400 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(248,168,136,0.45)]"
          >
            Start Saving Recipes
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center pt-[120px] pb-[clamp(80px,12vw,160px)] relative overflow-hidden"
      >
        <div className="absolute -top-[50%] -right-[20%] w-[80%] h-[150%] bg-[radial-gradient(ellipse_at_center,var(--tw-colors-peach-100)_0%,transparent_70%)] opacity-60 pointer-events-none" />
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <div className="relative z-10 max-w-[900px] mx-auto text-center">
            <h1 className="font-display font-medium text-warm-gray-700 leading-[1.15] text-[clamp(42px,8vw,80px)] tracking-[-0.02em] mb-6 animate-fadeInUp">
              Your Family Recipes.<br />
              <span className="text-peach-500">Safe Forever.</span>
            </h1>
            <p className="text-[clamp(18px,2.5vw,24px)] text-warm-gray-500 mb-12 max-w-[600px] mx-auto opacity-0 animate-[fadeInUp_1s_ease_0.2s_forwards]">
              Scan, save, and share the recipes you love – before they get lost.
            </p>
            <div className="opacity-0 animate-[fadeInUp_1s_ease_0.4s_forwards]">
              <Link
                href="#start"
                className="inline-flex items-center justify-center font-semibold text-[17px] no-underline transition-all duration-300 rounded-full px-9 py-[18px] bg-peach-300 text-warm-gray-700 shadow-[0_4px_24px_rgba(248,168,136,0.35)] hover:bg-peach-400 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(248,168,136,0.45)]"
              >
                Start Saving Recipes
              </Link>
            </div>
            <div className="mt-16 opacity-0 animate-[fadeInUp_1s_ease_0.6s_forwards]">
              <div className="w-full max-w-[900px] mx-auto rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(61,54,50,0.18)]">
                <Image
                  src="/assets/hero-image.jpeg"
                  alt="RecipeKeeper app showing a digitized Apple Pie recipe next to the original handwritten recipe card"
                  width={900}
                  height={600}
                  priority
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-[clamp(80px,12vw,160px)] bg-cream-dark">
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <div className="max-w-[800px] mx-auto text-center fade-in">
            <h2 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(32px,5vw,56px)] tracking-[-0.01em] mb-10">
              Recipes Get Lost.<br />
              Memories Fade.
            </h2>
            <div className="text-[clamp(18px,2.2vw,22px)] leading-relaxed">
              <p className="mb-6">
                Your mom&apos;s handwritten notes. Grandma&apos;s secret cake. That one
                dish your aunt makes at every holiday.
              </p>
              <p className="mb-6">
                These recipes live on sticky notes. In old notebooks. In
                someone&apos;s head.
              </p>
              <p className="font-display text-[clamp(22px,3vw,32px)] text-warm-gray-700 italic">
                One day, they might be gone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-[clamp(80px,12vw,160px)]">
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <div className="max-w-[900px] mx-auto text-center fade-in">
            <h2 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(32px,5vw,56px)] tracking-[-0.01em] mb-12">
              Turn Any Recipe Into<br />a Digital Treasure
            </h2>
            <p className="text-[clamp(18px,2vw,20px)] mb-10 text-warm-gray-500">
              RecipeKeeper makes it easy:
            </p>
            <div className="grid gap-8">
              <div className="flex gap-6 items-start p-8 bg-white rounded-3xl shadow-[0_4px_24px_rgba(61,54,50,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(61,54,50,0.1)] flex-col md:flex-row md:text-left text-center">
                <div className="shrink-0 w-14 h-14 bg-peach-100 rounded-2xl flex items-center justify-center text-[28px] mx-auto md:mx-0">
                  📸
                </div>
                <div>
                  <h3 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(22px,3vw,28px)] mb-2">
                    Snap a photo
                  </h3>
                  <p className="text-warm-gray-500 text-[clamp(16px,2vw,20px)]">
                    Of a handwritten card, a cookbook page, or a printout
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start p-8 bg-white rounded-3xl shadow-[0_4px_24px_rgba(61,54,50,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(61,54,50,0.1)] flex-col md:flex-row md:text-left text-center">
                <div className="shrink-0 w-14 h-14 bg-peach-100 rounded-2xl flex items-center justify-center text-[28px] mx-auto md:mx-0">
                  📄
                </div>
                <div>
                  <h3 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(22px,3vw,28px)] mb-2">
                    Upload a PDF
                  </h3>
                  <p className="text-warm-gray-500 text-[clamp(16px,2vw,20px)]">
                    From an email or saved file
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start p-8 bg-white rounded-3xl shadow-[0_4px_24px_rgba(61,54,50,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(61,54,50,0.1)] flex-col md:flex-row md:text-left text-center">
                <div className="shrink-0 w-14 h-14 bg-peach-100 rounded-2xl flex items-center justify-center text-[28px] mx-auto md:mx-0">
                  ✨
                </div>
                <div>
                  <h3 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(22px,3vw,28px)] mb-2">
                    Let AI do the work
                  </h3>
                  <p className="text-warm-gray-500 text-[clamp(16px,2vw,20px)]">
                    We read and organize the recipe for you
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-12 text-[clamp(18px,2vw,20px)] text-warm-gray-500">
              No more typing. No more searching. Just scan and save.
            </p>
          </div>
        </div>
      </section>

      {/* Save From Everywhere Section */}
      <section className="py-[clamp(80px,12vw,160px)] bg-peach-50 overflow-hidden">
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="lg:w-1/2 fade-in text-center lg:text-left">
              <h2 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(32px,5vw,56px)] tracking-[-0.01em] mb-6">
                Save Recipes<br />From Everywhere
              </h2>
              <p className="text-[clamp(18px,2vw,22px)] text-warm-gray-600 mb-10 leading-relaxed">
                Found a great recipe on Instagram? A friend texted you their famous pasta sauce? Saw something amazing on a food blog?
              </p>

              <div className="space-y-8 mb-10 text-left">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm text-peach-500">
                    💬
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-warm-gray-700 font-semibold mb-1">From friends</h3>
                    <p className="text-warm-gray-500">Screenshot their text or photo and scan it</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm text-peach-500">
                    📱
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-warm-gray-700 font-semibold mb-1">From social media</h3>
                    <p className="text-warm-gray-500">Capture recipes from Instagram, TikTok, or Pinterest</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm text-peach-500">
                    🌐
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-warm-gray-700 font-semibold mb-1">From websites</h3>
                    <p className="text-warm-gray-500">Save that blog recipe before it disappears</p>
                  </div>
                </div>
              </div>

              <p className="font-medium text-peach-600 text-lg">
                No more lost bookmarks. No more scrolling through old messages. Every recipe you love – in one app.
              </p>
            </div>

            <div className="lg:w-1/2 relative fade-in">
              {/* Composition of screenshots */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(61,54,50,0.15)] bg-white border-4 border-white max-w-[500px] mx-auto lg:ml-auto lg:mr-10">
                <Image
                  src="/assets/desktop-app-preview.jpg"
                  alt="RecipeKeeper Desktop Dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-12 -right-4 lg:-right-8 z-20 w-[180px] lg:w-[220px] rounded-[32px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.2)] border-8 border-white">
                <Image
                  src="/assets/mobile-app-preview.jpg"
                  alt="RecipeKeeper Mobile App"
                  width={300}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              {/* Decorative background circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-peach-100/50 rounded-full -z-10 blur-3xl opacity-60 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-[clamp(80px,12vw,160px)] bg-white">
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <h2 className="text-center fade-in font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(32px,5vw,56px)] tracking-[-0.01em] mb-16">
            Everything You Need to<br />
            Keep Your Recipes Safe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: "🔍",
                title: "Smart Scanning",
                desc: "Take a picture. Our AI reads the recipe and saves it. Works with photos, PDFs, and even messy handwriting.",
              },
              {
                icon: "📷",
                title: "Add Your Own Photos",
                desc: "Upload pictures of each cooking step. Add a photo of the finished dish. Make your recipes come alive.",
              },
              {
                icon: "📂",
                title: "Organized by Category",
                desc: "Appetizers. Main dishes. Desserts. Soups. Snacks. Find any recipe in seconds.",
              },
              {
                icon: "💝",
                title: "Remember Where It Came From",
                desc: "Tag each recipe with its source. Mom. Grandma. A friend. Never forget where the recipe started.",
              },
              {
                icon: "📚",
                title: "Build Collections",
                desc: 'Group your favorites. Create a "Mom\'s Recipes" collection. Or "Holiday Baking." Or "Quick Weeknight Dinners."',
              },
              {
                icon: "📖",
                title: "Create a Recipe Book",
                desc: "Turn your collection into a beautiful PDF. Print it. Share it. Pass it on.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="feature fade-in p-10 bg-cream rounded-[28px] transition-transform duration-300 hover:-translate-y-1.5"
              >
                <div className="w-16 h-16 bg-peach-100 rounded-[18px] flex items-center justify-center text-[32px] mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(22px,3vw,28px)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-warm-gray-500 text-[17px]">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Section */}
      <section className="py-[clamp(80px,12vw,160px)] bg-gradient-to-b from-cream to-peach-50">
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <div className="max-w-[1000px] mx-auto fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(61,54,50,0.15)] order-1 md:order-none max-w-[400px] mx-auto md:max-w-none">
                <Image
                  src="/assets/generational.jpeg"
                  alt="Hands passing down a treasured handwritten recipe card between generations"
                  width={500}
                  height={500}
                  className="w-full h-auto block"
                />
              </div>
              <div className="text-center md:text-left">
                <h2 className="font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(32px,5vw,56px)] tracking-[-0.01em] mb-6">
                  Keep Mom&apos;s Recipes Alive
                </h2>
                <div className="text-[clamp(18px,2vw,22px)] leading-relaxed text-warm-gray-600">
                  <p className="mb-5">
                    Some recipes are more than food. They are memories. They are
                    love. They are home.
                  </p>
                  <p>
                    RecipeKeeper helps you save them – so you can cook them, share
                    them, and pass them on to the next generation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-[clamp(80px,12vw,160px)] bg-warm-gray-700 text-white overflow-hidden">
        <div className="container mx-auto text-center">
          <h2 className="fade-in font-display font-medium leading-[1.15] text-[clamp(32px,5vw,56px)] tracking-[-0.01em] mb-16 text-white">
            3 Steps to Save a Recipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12 max-w-[900px] mx-auto">
            {[
              {
                img: "/assets/step-1-scan.jpeg",
                alt: "RecipeKeeper scan interface showing recipe upload",
                num: "1",
                title: "Scan",
                desc: "Take a photo or upload a file",
              },
              {
                img: "/assets/step-2-review.jpeg",
                alt: "AI extracting recipe details automatically",
                num: "2",
                title: "Review",
                desc: "Check the details our AI found",
              },
              {
                img: "/assets/step-3-save.jpeg",
                alt: "Saved recipe detail page in RecipeKeeper",
                num: "3",
                title: "Save",
                desc: "Your recipe is stored forever",
              },
            ].map((step, i) => (
              <div key={i} className="step fade-in text-center">
                <div className="w-full max-w-[280px] mx-auto mb-6 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-transform duration-400 hover:scale-[1.03] hover:-translate-y-2">
                  <Image
                    src={step.img}
                    alt={step.alt}
                    width={280}
                    height={500}
                    className="w-full h-auto block object-cover object-[center_15%]"
                  />
                </div>
                <div className="font-display text-[48px] font-bold text-peach-300 leading-none mb-3 opacity-90">
                  {step.num}
                </div>
                <h3 className="text-white mb-2 font-display text-[clamp(22px,3vw,28px)]">
                  {step.title}
                </h3>
                <p className="text-warm-gray-300 text-base">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="closing fade-in font-display text-[clamp(24px,3vw,32px)] text-peach-200 italic">
            That&apos;s it. Simple.
          </p>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-[clamp(80px,12vw,160px)] bg-cream">
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <h2 className="text-center fade-in font-display text-warm-gray-700 font-medium leading-[1.15] text-[clamp(32px,5vw,56px)] tracking-[-0.01em] mb-16">
            Families Trust RecipeKeeper
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "I finally saved all of my mom's recipes. Now my kids can cook them too.",
              "No more digging through boxes. Everything is in one place.",
              "The scanning works so well – even on my grandma's old cards."
            ].map((quote, i) => (
              <div key={i} className="testimonial fade-in bg-white p-10 rounded-[28px] shadow-[0_4px_24px_rgba(61,54,50,0.06)] relative overflow-hidden">
                <div className="absolute top-2.5 left-6 font-display text-[120px] text-peach-200 leading-none opacity-50 select-none">
                  &quot;
                </div>
                <p className="relative z-10 text-[18px] italic text-warm-gray-600 leading-[1.7]">
                  {quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        id="start"
        ref={finalCtaRef}
        className="py-[clamp(80px,12vw,160px)] bg-gradient-to-b from-peach-100 to-peach-200 text-center"
      >
        <div className="container mx-auto px-[clamp(20px,5vw,40px)]">
          <div className="max-w-[700px] mx-auto fade-in">
            <h2 className="font-display font-medium text-warm-gray-700 leading-[1.15] text-[clamp(40px,7vw,64px)] tracking-[-0.02em] mb-6">
              Don&apos;t Let Another Recipe Get Lost
            </h2>
            <p className="text-[clamp(18px,2vw,22px)] text-warm-gray-600 mb-10">Start saving today. It&apos;s free to try.</p>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center font-semibold text-[19px] no-underline transition-all duration-300 rounded-full px-12 py-[22px] bg-warm-gray-700 text-white shadow-[0_4px_24px_rgba(248,168,136,0.35)] hover:bg-warm-gray-600 hover:shadow-[0_12px_40px_rgba(61,54,50,0.25)] hover:-translate-y-0.5"
            >
              Get Started at RecipeKeeper.org
            </Link>

            <div className="mt-6 text-sm text-warm-gray-500 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-peach-600">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-cream-dark border-t border-warm-gray-100">
        <div className="container mx-auto px-[clamp(20px,5vw,40px)] flex flex-col items-center gap-4 text-center">
          <p className="font-script text-xl text-peach-600">
            RecipeKeeper – Because some recipes are worth keeping forever.
          </p>
          <div className="my-4 text-sm">
            <Link href="/terms" className="text-warm-gray-500 hover:text-warm-gray-700 no-underline mr-4 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-warm-gray-500 hover:text-warm-gray-700 no-underline transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="text-sm text-warm-gray-400">
            © 2026 RecipeKeeper. Made with love for families everywhere.
          </p>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-4 bg-cream/95 backdrop-blur-md border-t border-warm-gray-100 z-[99] transition-transform duration-300 md:hidden ${isStickyVisible ? "translate-y-0" : "translate-y-full"
          }`}
      >
        <Link
          href="#start"
          className="flex w-full items-center justify-center font-semibold text-[17px] no-underline transition-all duration-300 rounded-full px-8 py-4 bg-peach-300 text-warm-gray-700 shadow-lg"
        >
          Start Saving Recipes
        </Link>
      </div>
    </div>
  );
}
