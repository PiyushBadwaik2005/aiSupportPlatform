"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  FileText,
  ShieldCheck,
  Code2,
  ArrowRight,
  UploadCloud,
  Cpu,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <header className="h-18 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">AI Support Platform</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#integrations" className="hover:text-blue-600 transition-colors">Integrations & API</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Grounded RAG Powered by LangChain & Gemini</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
          Create your own AI customer support assistant using your business documents.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Answer customer questions accurately, prevent hallucinations with strict evidence evaluation, and integrate the assistant directly into your website and business software.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl transition-all"
          >
            Owner Login
          </Link>
        </div>

        {/* Workflow Architecture Illustration */}
        <div className="pt-12">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-lg text-left space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                End-to-End Grounded Support Pipeline
              </span>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Conservative Grounding Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">1. Ingest Documents</h2>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Upload PDF, DOCX, and TXT files. Parsed into overlapping chunks with metadata preservation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Search className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">2. Hybrid Retrieval</h2>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Multi-tenant retrieval extracts relevant chunks strictly isolated to your verified business documents.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">3. Evidence Check</h2>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Evaluates relevance cutoff and query overlap. If evidence is missing, returns safe fallback.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">4. Gemini Generation</h2>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Generates fluent answers with verified citations while treating document contents as untrusted data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 sm:px-12 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Built for Grounded Business Accuracy
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Eliminate generative hallucination risks. Customers receive verified answers or a safe fallback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Format Knowledge Base</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload company return policies, warranty guides, product catalogs, and operating manuals in PDF, DOCX, or TXT formats with automatic re-indexing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero Hallucinations Guarantee</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When supporting facts are ambiguous or missing, the assistant returns your controlled fallback message and logs the question for business review.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Business Integration REST API</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrate into web applications, mobile apps, and e-commerce platforms using cryptographically hashed API keys with automatic rate limiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">How It Works in 3 Simple Steps</h2>
          <p className="text-sm text-slate-500">Go live with your custom AI assistant in under 5 minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-base font-bold text-slate-900">Upload Your Documents</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Drag and drop your company documents. Our LangChain pipeline extracts text, structures overlapping chunks, and builds semantic indexes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-base font-bold text-slate-900">Test in AI Playground</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask real-world questions in the playground console. Inspect source citations, relevance confidence scores, and verify fallback behavior.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="text-base font-bold text-slate-900">Embed & Integrate</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Drop the customer chat widget into your website or connect your backend services using our versioned REST API.
            </p>
          </div>
        </div>
      </section>

      {/* Integration & API Section */}
      <section id="integrations" className="py-20 px-6 sm:px-12 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Developer-First Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              A versioned REST API built for real enterprise workloads.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate hashed API keys with rotation support, monitor request latencies in real time, and protect your tenant boundary with strict database isolation.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <span>Generate API Key</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-2xl">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2">POST /api/v1/integrations/chat</span>
            </div>
            <pre className="text-slate-300 leading-relaxed">
{`curl -X POST https://api.supportplatform.com/api/v1/integrations/chat \\
  -H "Authorization: Bearer aisp_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What is your refund return window?"
  }'

# Response:
{
  "success": true,
  "data": {
    "answer": "You can request a refund within 30 days of purchase.",
    "answered": true,
    "sources": [
      {
        "documentTitle": "Return Policy 2026.pdf",
        "page": 2,
        "snippet": "Refunds are processed within 30 days..."
      }
    ],
    "conversationId": "65f0abc123456"
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-6 sm:px-12 text-center bg-blue-600 text-white space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ready to automate customer support with verified accuracy?
        </h2>
        <p className="text-sm text-blue-100 max-w-xl mx-auto">
          Sign up now, upload your documentation, and deploy your custom AI assistant today.
        </p>
        <div className="pt-2">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-white text-blue-600 hover:bg-blue-50 text-sm font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 sm:px-12 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <p>© 2026 AI Support Platform. Full-Stack LangChain, Gemini & Grounded RAG Architecture.</p>
      </footer>
    </div>
  );
}

