"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import type { MediaDetails } from "~/app/api/tmdb/details/route";
import { formatReleaseInfo } from "~/lib/format-year";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mediaType: "movie" | "tv";
  mediaId: number | null;
};

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: MediaDetails };

// Simple in-memory cache for fetched details
const detailsCache = new Map<string, MediaDetails>();

function getCacheKey(type: "movie" | "tv", id: number): string {
  return `${type}-${id}`;
}

export default function DetailModal({ isOpen, onClose, mediaType, mediaId }: Props) {
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Fetch details when modal opens
  useEffect(() => {
    if (!isOpen || mediaId === null) {
      setFetchState({ status: "idle" });
      return;
    }

    const cacheKey = getCacheKey(mediaType, mediaId);
    const cached = detailsCache.get(cacheKey);

    if (cached) {
      setFetchState({ status: "success", data: cached });
      return;
    }

    setFetchState({ status: "loading" });

    const controller = new AbortController();

    fetch(`/api/tmdb/details?type=${mediaType}&id=${mediaId}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to load details`);
        }
        return res.json() as Promise<MediaDetails>;
      })
      .then((data) => {
        detailsCache.set(cacheKey, data);
        setFetchState({ status: "success", data });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setFetchState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load details",
        });
      });

    return () => controller.abort();
  }, [isOpen, mediaId, mediaType]);

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else {
      dialog.close();
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Close on ESC (native dialog handles this, but we need to sync state)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Close on ESC key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="m-0 h-full max-h-full w-full max-w-full bg-transparent p-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm md:m-auto md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      aria-labelledby="modal-title"
    >
      <div className="flex h-full flex-col overflow-hidden bg-slate-900 md:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-100">
            {fetchState.status === "success"
              ? fetchState.data.title
              : mediaType === "movie"
                ? "Movie Details"
                : "TV Show Details"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {fetchState.status === "loading" && (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">Loading details…</div>
            </div>
          )}

          {fetchState.status === "error" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <div className="font-semibold">Couldn't load details</div>
              <div className="mt-1 text-red-100/90">{fetchState.message}</div>
            </div>
          )}

          {fetchState.status === "success" && (
            <div className="space-y-4">
              {/* Poster + Info */}
              <div className="flex gap-4">
                {fetchState.data.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${fetchState.data.poster_path}`}
                    alt={fetchState.data.title}
                    className="h-auto w-28 flex-shrink-0 rounded-lg object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-40 w-28 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-400">
                    No poster
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  {/* Title + Original Title */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-50">{fetchState.data.title}</h3>
                    {fetchState.data.original_title &&
                      fetchState.data.original_title !== fetchState.data.title && (
                        <p className="text-sm text-slate-400">{fetchState.data.original_title}</p>
                      )}
                  </div>

                  {/* Release Info */}
                  <p className="text-sm text-slate-300">
                    {formatReleaseInfo(
                      fetchState.data.release_year,
                      fetchState.data.media_type,
                      fetchState.data.number_of_seasons,
                      fetchState.data.number_of_episodes
                    )}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-sm font-semibold text-slate-950">
                      ★ {fetchState.data.vote_average.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400">
                      ({fetchState.data.vote_count.toLocaleString()} votes)
                    </span>
                  </div>
                </div>
              </div>

              {/* Overview */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-300">Overview</h4>
                <p className="text-sm leading-relaxed text-slate-200">
                  {fetchState.data.overview || "No overview available."}
                </p>
              </div>

              {/* Cast */}
              {fetchState.data.cast.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-300">Cast</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {fetchState.data.cast.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2"
                      >
                        {member.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${member.profile_path}`}
                            alt={member.name}
                            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-400">
                            ?
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">{member.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
