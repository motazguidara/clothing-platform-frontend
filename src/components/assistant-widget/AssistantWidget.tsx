\"use client\";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { tokenStore } from "@/lib/auth/tokens";
import "./assistant-widget.css";

type WidgetConfig = {
  tenantId: string;
  embedKey: string;
  mode: "floating" | "inline";
  containerId?: string;
  contextProvider?: () => Record<string, unknown>;
  theme?: {
    primary?: string;
    radius?: number;
  };
};

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  cards?: Card[];
};

type Card = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  attributes?: string[];
  value?: string;
  reason_text?: string;
  deep_link?: string;
  actions?: { type: string; label: string }[];
};

type Envelope = {
  reply_text?: string;
  cards?: Card[];
  followups?: string[];
  errors?: string[];
  model?: string;
  state_patch?: Record<string, unknown>;
};

type CreditInfo = {
  balance: number;
  unlimited: boolean;
};

const DEFAULT_THEME = {
  primary: "#111827",
  radius: 16,
};

const AssistantWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [followups, setFollowups] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [creditsBlocked, setCreditsBlocked] = useState(false);
  const sessionIdRef = useRef(`sess_${Math.random().toString(36).slice(2)}`);
  const sessionStateRef = useRef<Record<string, unknown>>({});
  const theme = { ...DEFAULT_THEME, ...config.theme };

  useEffect(() => {
    setMessages([
      { id: "welcome", role: "assistant", text: "Hi! Tell me what you are looking for." },
    ]);
  }, []);

  const refreshCredits = async () => {
    try {
      const response = await fetch("/api/widget/credits", {
        headers: {
          "X-Tenant-Id": config.tenantId,
          "X-Embed-Key": config.embedKey,
        },
      });
      if (response.ok) {
        const data = (await response.json()) as CreditInfo;
        setCredits(data);
        if (data.unlimited || data.balance > 0) {
          setCreditsBlocked(false);
        }
      }
    } catch {
      // ignore credit UI failures
    }
  };

  useEffect(() => {
    refreshCredits();
  }, []);

  const trackEvent = async (eventType: string, payload: Record<string, unknown>) => {
    try {
      await fetch("/api/widget/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": config.tenantId,
          "X-Embed-Key": config.embedKey,
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          event_type: eventType,
          payload,
        }),
      });
    } catch {
      // ignore tracking failures
    }
  };

  const openDeepLink = (url: string | undefined, payload: Record<string, unknown>) => {
    if (!url) return;
    let resolved: URL;
    try {
      resolved = new URL(url, window.location.origin);
    } catch {
      return;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;
    trackEvent("link_opened", { ...payload, url: resolved.toString() });
    window.open(resolved.toString(), "_blank", "noopener,noreferrer");
  };

  const sendMessage = async (text: string) => {
    const payload = {
      session_id: sessionIdRef.current,
      message: text,
      context: config.contextProvider ? config.contextProvider() : {},
      state: sessionStateRef.current,
    };
    setMessages((prev) => [...prev, { id: `user_${Date.now()}`, role: "user", text }]);
    setLoading(true);
    try {
      const response = await fetch("/api/widget/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": config.tenantId,
          "X-Embed-Key": config.embedKey,
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as Envelope;
      if (data.state_patch) {
        sessionStateRef.current = { ...sessionStateRef.current, ...data.state_patch };
      }
      if (data.errors?.includes("insufficient_credits")) {
        setCreditsBlocked(true);
      }
      refreshCredits();
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          text: data.reply_text ?? "",
          cards: data.cards ?? [],
        },
      ]);
      setFollowups(data.followups ?? []);
    } finally {
      setLoading(false);
    }
  };

  const sendAction = async (action: { type: string; label: string }, card?: Card) => {
    const payload = {
      session_id: sessionIdRef.current,
      action: { type: action.type, label: action.label, item_id: card?.id },
      context: config.contextProvider ? config.contextProvider() : {},
      state: sessionStateRef.current,
    };
    setLoading(true);
    try {
      const response = await fetch("/api/widget/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": config.tenantId,
          "X-Embed-Key": config.embedKey,
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as Envelope;
      if (data.state_patch) {
        sessionStateRef.current = { ...sessionStateRef.current, ...data.state_patch };
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          text: data.reply_text ?? "",
          cards: data.cards ?? [],
        },
      ]);
      setFollowups(data.followups ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || inputDisabled) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleFollowup = (text: string) => {
    if (inputDisabled) return;
    sendMessage(text);
  };

  const panelClass = open ? "awp-panel awp-panel-open" : "awp-panel";
  const containerClass = config.mode === "inline" ? "awp-inline" : "awp-floating";
  const creditsDepleted = credits && !credits.unlimited && credits.balance <= 0;
  const inputDisabled = creditsBlocked || creditsDepleted;

  const handleBuyCredits = () => {
    window.dispatchEvent(new CustomEvent("awp:buy-credits", { detail: { tenantId: config.tenantId } }));
  };

  return (
    <div
      className={`awp-root ${containerClass}`}
      style={{ "--awp-primary": theme.primary, "--awp-radius": `${theme.radius}px` } as React.CSSProperties}
    >
      {config.mode === "floating" && (
        <button className="awp-launcher" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Close" : "Assistant"}
        </button>
      )}
      <div className={panelClass} aria-hidden={!open && config.mode === "floating"}>
        <div className="awp-header">
          <div>
            <h3>Assistant</h3>
            <p>Smart recommendations</p>
            {credits && (
              <p>{credits.unlimited ? "Credits: unlimited" : `Credits: ${credits.balance}`}</p>
            )}
          </div>
          {config.mode === "floating" && (
            <button className="awp-close" onClick={() => setOpen(false)} aria-label="Close">
              X
            </button>
          )}
        </div>
        <div className="awp-thread">
          {messages.map((msg) => (
            <div key={msg.id} className={`awp-bubble awp-${msg.role}`}>
              {msg.text}
              {msg.cards && msg.cards.length > 0 && (
                <div className="awp-results">
                  {msg.cards.map((card) => (
                    <div
                      key={card.id}
                      className="awp-card"
                      onClick={() => openDeepLink(card.deep_link, { card_id: card.id, source: "card" })}
                    >
                      {card.image && <img src={card.image} alt={card.title} />}
                      <div className="awp-card-body">
                        <h4>{card.title}</h4>
                        {card.subtitle && <p>{card.subtitle}</p>}
                        {card.attributes && card.attributes.length > 0 && (
                          <div className="awp-attrs">{card.attributes.join(" - ")}</div>
                        )}
                        {card.value && <div className="awp-value">{card.value}</div>}
                        {card.reason_text && <div className="awp-reason">{card.reason_text}</div>}
                        <div className="awp-card-actions">
                          {card.deep_link && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openDeepLink(card.deep_link, { card_id: card.id, source: "button" });
                              }}
                            >
                              View
                            </button>
                          )}
                          {card.actions?.map((action) => (
                            <button
                              key={action.type}
                              onClick={(event) => {
                                event.stopPropagation();
                                trackEvent("card_action", { card_id: card.id, action: action.type });
                                sendAction(action, card);
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="awp-bubble awp-assistant">Typing...</div>}
        </div>
        {followups.length > 0 && !inputDisabled && (
          <div className="awp-chips">
            {followups.map((chip) => (
              <button key={chip} onClick={() => handleFollowup(chip)}>
                {chip}
              </button>
            ))}
          </div>
        )}
        {creditsDepleted && (
          <div className="awp-credits-banner">
            <span>Out of credits.</span>
            <button type="button" onClick={handleBuyCredits}>Buy credits</button>
          </div>
        )}
        <form className="awp-input" onSubmit={handleSubmit}>
          <input
            id="awp-input"
            name="awp-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask anything"
            disabled={inputDisabled}
            aria-label="Ask anything"
          />
          <button type="submit" disabled={inputDisabled}>Send</button>
        </form>
      </div>
    </div>
  );
};

const AssistantWidgetProvider: React.FC = () => {
  const config = useMemo<WidgetConfig>(() => {
    const tenantId = process.env["NEXT_PUBLIC_WIDGET_TENANT_ID"] || "1";
    const embedKey = process.env["NEXT_PUBLIC_WIDGET_EMBED_KEY"] || "clothing-embed-key";
    return {
      tenantId,
      embedKey,
      mode: "floating",
      contextProvider: () => {
        const token = tokenStore.getAccess();
        return {
          page_type: typeof window !== "undefined" ? window.location.pathname : "unknown",
          adapter: "remote_ecommerce",
          auth_token: token,
        };
      },
      theme: {
        primary: "#111827",
        radius: 16,
      },
    };
  }, []);

  return <AssistantWidget config={config} />;
};

export default AssistantWidgetProvider;
