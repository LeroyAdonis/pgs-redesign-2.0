"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Card } from "@/components/layout/Card";
import { EmptyState } from "@/components/data/EmptyState";
import { Modal } from "@/components/overlays";
import type { SocialAccountDTO, PlatformDisplayInfo, Platform } from "@/lib/social/types";

import { PlatformIcon } from "./platform-icon";

// ─── Types ─────────────────────────────────────────────────────

interface AccountsManagerProps {
  accounts: SocialAccountDTO[];
  orgId: string;
  platformDisplay: Record<Platform, PlatformDisplayInfo>;
  successPlatform?: string;
  errorType?: string;
  errorPlatform?: string;
}

type StatusVariant = "success" | "warning" | "error" | "default";

const STATUS_MAP: Record<SocialAccountDTO["status"], { label: string; variant: StatusVariant }> = {
  connected: { label: "Connected", variant: "success" },
  expiring: { label: "Expiring Soon", variant: "warning" },
  expired: { label: "Expired", variant: "error" },
  error: { label: "Disconnected", variant: "error" },
};

// ─── Component ─────────────────────────────────────────────────

export function AccountsManager({
  accounts: initialAccounts,
  orgId,
  platformDisplay,
  successPlatform,
  errorType,
  errorPlatform,
}: AccountsManagerProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Show success/error notifications from URL params
  useEffect(() => {
    if (successPlatform) {
      const display = platformDisplay[successPlatform as Platform];
      setNotification({
        type: "success",
        message: `${display?.name ?? successPlatform} connected successfully!`,
      });

      // Clear URL params
      router.replace("/dashboard/accounts");
    } else if (errorType) {
      const platformName = errorPlatform
        ? platformDisplay[errorPlatform as Platform]?.name ?? errorPlatform
        : "";

      const messages: Record<string, string> = {
        oauth_denied: `${platformName} authorization was denied.`,
        connect_failed: "Failed to initiate connection. Please try again.",
        callback_failed: "Connection failed. Please try again.",
        invalid_state: "Session expired. Please try connecting again.",
        expired: "Connection session timed out. Please try again.",
        missing_params: "Invalid callback from platform.",
      };

      setNotification({
        type: "error",
        message: messages[errorType] ?? "An error occurred.",
      });

      router.replace("/dashboard/accounts");
    }
  }, [successPlatform, errorType, errorPlatform, platformDisplay, router]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleConnect = useCallback(
    (platform: Platform) => {
      window.location.href = `/api/social/connect/${platform}?orgId=${orgId}`;
    },
    [orgId],
  );

  const handleDisconnect = useCallback(
    async (accountId: string) => {
      setDisconnectingId(accountId);
      try {
        const res = await fetch("/api/social/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId, orgId }),
        });

        if (!res.ok) throw new Error("Disconnect failed");

        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        setNotification({ type: "success", message: "Account disconnected." });
      } catch {
        setNotification({
          type: "error",
          message: "Failed to disconnect. Please try again.",
        });
      } finally {
        setDisconnectingId(null);
        setConfirmDisconnectId(null);
      }
    },
    [orgId],
  );

  const handleRefresh = useCallback(
    async (accountId: string) => {
      setRefreshingId(accountId);
      try {
        const res = await fetch(`/api/social/refresh/${accountId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId }),
        });

        if (!res.ok) throw new Error("Refresh failed");

        // Update the account status locally
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === accountId ? { ...a, status: "connected" as const } : a,
          ),
        );
        setNotification({ type: "success", message: "Token refreshed!" });
      } catch {
        setNotification({
          type: "error",
          message: "Token refresh failed. You may need to reconnect.",
        });
      } finally {
        setRefreshingId(null);
      }
    },
    [orgId],
  );

  const activeAccounts = accounts.filter((a) => a.isActive);
  const connectedPlatforms = new Set(activeAccounts.map((a) => a.platform));

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
            Social Accounts
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Connect and manage your social media accounts.
          </p>
        </div>
        <Button onClick={() => setIsConnectModalOpen(true)}>
          Connect Account
        </Button>
      </div>

      {/* ── Notification Banner ── */}
      {notification && (
        <div
          role="alert"
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-sm",
            notification.type === "success" &&
              "border-success/30 bg-success-surface text-success",
            notification.type === "error" &&
              "border-error/30 bg-error-surface text-error",
          )}
        >
          {notification.message}
        </div>
      )}

      {/* ── Account Grid ── */}
      {activeAccounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeAccounts.map((account) => {
            const display = platformDisplay[account.platform];
            const statusInfo = STATUS_MAP[account.status];

            return (
              <Card key={account.id} padding="none" className="relative">
                <div className="p-5">
                  {/* Platform header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${display.color}15` }}
                    >
                      <PlatformIcon
                        platform={account.platform}
                        className="h-5 w-5"
                        style={{ color: display.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">
                        {display.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {account.displayName ?? account.platformUserId}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant} dot size="sm">
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Token expiry info */}
                  {account.tokenExpiresAt && (
                    <p className="mb-4 text-xs text-text-muted">
                      Token expires:{" "}
                      <span
                        className={cn(
                          account.status === "expired" && "text-error",
                          account.status === "expiring" && "text-warning",
                        )}
                      >
                        {new Date(account.tokenExpiresAt).toLocaleDateString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                        })}
                      </span>
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {(account.status === "expired" ||
                      account.status === "expiring") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={refreshingId === account.id}
                        onClick={() => handleRefresh(account.id)}
                      >
                        Refresh Token
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={disconnectingId === account.id}
                      onClick={() => setConfirmDisconnectId(account.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          }
          title="No accounts connected"
          description="Connect your social media accounts to start creating and scheduling posts."
          action={
            <Button onClick={() => setIsConnectModalOpen(true)}>
              Connect Your First Account
            </Button>
          }
        />
      )}

      {/* ── Connect Modal ── */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect a Social Account"
        size="md"
      >
        <div className="space-y-3">
          {Object.values(platformDisplay).map((platform) => {
            const isConnected = connectedPlatforms.has(platform.id);

            return (
              <button
                key={platform.id}
                type="button"
                disabled={!platform.available || isConnected}
                onClick={() => {
                  setIsConnectModalOpen(false);
                  handleConnect(platform.id);
                }}
                className={cn(
                  "flex w-full items-center gap-4 rounded-lg border border-border p-4",
                  "transition-all duration-150",
                  platform.available && !isConnected
                    ? "cursor-pointer hover:border-brand hover:bg-brand-surface"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${platform.color}15` }}
                >
                  <PlatformIcon
                    platform={platform.id}
                    className="h-5 w-5"
                    style={{ color: platform.color }}
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-text">{platform.name}</p>
                  <p className="text-xs text-text-muted">
                    {platform.description}
                  </p>
                </div>
                {isConnected ? (
                  <Badge variant="success" size="sm">
                    Connected
                  </Badge>
                ) : !platform.available ? (
                  <Badge variant="default" size="sm">
                    Coming Soon
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ── Disconnect Confirmation Modal ── */}
      <Modal
        isOpen={confirmDisconnectId !== null}
        onClose={() => setConfirmDisconnectId(null)}
        title="Disconnect Account?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDisconnectId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={disconnectingId !== null}
              onClick={() => {
                if (confirmDisconnectId) {
                  handleDisconnect(confirmDisconnectId);
                }
              }}
            >
              Disconnect
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          This will disconnect the account and stop all scheduled posts.
          You can reconnect it later. Brand profiles and analytics history
          will be preserved.
        </p>
      </Modal>
    </div>
  );
}
