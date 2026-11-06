"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { formatDate } from "../../../lib/utils";
import { ConfirmModal } from "../../../components/ConfirmModal";
import {
  KeyRound,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  Code2,
  Terminal,
  Globe,
  Lock,
  Layers,
  ExternalLink,
  X,
} from "lucide-react";

interface ApiKeyItem {
  _id: string;
  name: string;
  keyPrefix: string;
  status: "active" | "revoked";
  permissions: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export default function IntegrationsPage() {
  const { business } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Key modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Newly generated secret modal state (CRUCIAL: Only displayed ONCE!)
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Revoke modal state
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Rotate modal state
  const [rotateTarget, setRotateTarget] = useState<ApiKeyItem | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  // Copy code tab state
  const [copiedCodeTab, setCopiedCodeTab] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setIsLoading(true);
    const res = await apiRequest<ApiKeyItem[]>("/v1/integrations/keys");
    if (res.success && res.data) {
      setKeys(res.data);
    }
    setIsLoading(false);
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;

    setIsCreating(true);
    const res = await apiRequest<{ apiKey: ApiKeyItem; secretKey: string }>("/v1/integrations/keys", {
      method: "POST",
      body: JSON.stringify({ name: keyName.trim() }),
    });

    if (res.success && res.data) {
      setIsCreateOpen(false);
      setKeyName("");
      setNewKeySecret(res.data.secretKey);
      fetchKeys();
    } else {
      alert(`Failed to create API key: ${res.error}`);
    }
    setIsCreating(false);
  }

  async function handleConfirmRevoke() {
    if (!revokeTarget) return;
    setIsRevoking(true);

    const res = await apiRequest(`/v1/integrations/keys/${revokeTarget._id}`, {
      method: "DELETE",
    });

    if (res.success) {
      setRevokeTarget(null);
      fetchKeys();
    } else {
      alert(`Failed to revoke key: ${res.error}`);
    }
    setIsRevoking(false);
  }

  async function handleConfirmRotate() {
    if (!rotateTarget) return;
    setIsRotating(true);

    const res = await apiRequest<{ apiKey: ApiKeyItem; secretKey: string }>(
      `/v1/integrations/keys/${rotateTarget._id}/rotate`,
      { method: "POST" }
    );

    if (res.success && res.data) {
      setRotateTarget(null);
      setNewKeySecret(res.data.secretKey);
      fetchKeys();
    } else {
      alert(`Failed to rotate key: ${res.error}`);
    }
    setIsRotating(false);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    if (id === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodeTab(id);
      setTimeout(() => setCopiedCodeTab(null), 2000);
    }
  }

  const curlExample = `curl -X POST https://aisupportplatform-3.onrender.com/api/v1/integrations/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What is your refund policy?",
    "conversationId": null
  }'`;

  const jsExample = `const response = await fetch("https://aisupportplatform-3.onrender.com/api/v1/integrations/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    question: "How long does shipping take?",
    conversationId: null
  })
});

const data = await response.json();
console.log("Answer:", data.data.answer);
console.log("Sources:", data.data.sources);`;

  const pythonExample = `import requests

url = "https://aisupportplatform-3.onrender.com/api/v1/integrations/chat"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "question": "What are your return terms?",
    "conversationId": None
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const embedScript = `<!-- Place before closing </body> tag -->
<script
  src="https://aisupportplatform-2.onrender.com/widget.js"
  data-business="${business?.slug || "your-slug"}"
  async>
</script>`;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Integrations & Business API
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect your grounded support assistant to external websites, mobile apps, and backend services.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold text-blue-950">Secure Multi-Business API Design</p>
          <p className="mt-0.5 text-blue-800">
            API keys use SHA-256 HMAC cryptographic hashing with server peppers. Only a public prefix is stored in the database. When embedding into frontend browser JavaScript, never expose privileged keys — use our public chat token or backend proxy strategy.
          </p>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Active & Revoked API Keys</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[650px] w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Key Identifier</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading keys...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No API keys created yet. Generate your first API key above to integrate external applications.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{k.name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 bg-slate-50 px-2 rounded inline-block my-2">
                      {k.keyPrefix}...
                    </td>
                    <td className="py-3.5 px-4">
                      {k.status === "active" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {k.permissions.join(", ")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{formatDate(k.createdAt)}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {k.lastUsedAt ? formatDate(k.lastUsedAt) : "Never used"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {k.status === "active" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setRotateTarget(k)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                            title="Rotate key (revokes current key and generates fresh replacement)"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRevokeTarget(k)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Revoke key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer API Documentation & Code Examples */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Developer Documentation & Code Snippets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrate the RAG assistant into your external servers, webhooks, or mobile applications.
          </p>
        </div>

        {/* cURL Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-500" /> cURL Command
            </span>
            <button
              onClick={() => copyToClipboard(curlExample, "curl")}
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              {copiedCodeTab === "curl" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCodeTab === "curl" ? "Copied!" : "Copy cURL"}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {curlExample}
          </pre>
        </div>

        {/* JavaScript Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-slate-500" /> Node.js / TypeScript Example
            </span>
            <button
              onClick={() => copyToClipboard(jsExample, "js")}
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              {copiedCodeTab === "js" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCodeTab === "js" ? "Copied!" : "Copy JS"}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {jsExample}
          </pre>
        </div>

        {/* Python Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-slate-500" /> Python (Requests) Example
            </span>
            <button
              onClick={() => copyToClipboard(pythonExample, "python")}
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              {copiedCodeTab === "python" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCodeTab === "python" ? "Copied!" : "Copy Python"}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {pythonExample}
          </pre>
        </div>
      </div>

      {/* Create Key Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 mx-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Create New API Key</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Key Name / Purpose
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Mobile App"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                This key grants read and write access to the Customer Support RAG endpoints strictly scoped to your business.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !keyName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isCreating ? "Generating..." : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret Shown Once Modal */}
      {newKeySecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 sm:p-6 mx-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">API Secret Generated</h3>
                <p className="text-xs text-slate-500">Please copy your secret key now.</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                <strong>This is the only time this secret will ever be displayed.</strong> It is not stored in plain text anywhere on our servers. If you lose it, you will need to rotate or generate a new key.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Your Full API Key Secret:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newKeySecret}
                  className="flex-1 font-mono text-xs bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-slate-800 select-all"
                />
                <button
                  onClick={() => copyToClipboard(newKeySecret, "secret")}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSecret ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setNewKeySecret(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                I Have Saved My Secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      <ConfirmModal
        isOpen={!!revokeTarget}
        title="Revoke API Key"
        message={`Are you sure you want to revoke "${revokeTarget?.name}"? Any external applications or webhooks using this key will immediately lose access.`}
        confirmText="Revoke Key"
        isDestructive={true}
        isLoading={isRevoking}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setRevokeTarget(null)}
      />

      {/* Rotate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!rotateTarget}
        title="Rotate API Key"
        message={`Rotating "${rotateTarget?.name}" will immediately invalidate the current secret and generate a new key with identical permissions. Proceed?`}
        confirmText="Rotate Key"
        isDestructive={false}
        isLoading={isRotating}
        onConfirm={handleConfirmRotate}
        onCancel={() => setRotateTarget(null)}
      />
    </div>
  );
}

