"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useState } from "react";

type Props = {
  playbackId: string;
  poster: string;
  /** 48px webp als data-URI: staat direct in de HTML, kost geen request. */
  placeholder?: string;
};

/**
 * Op trage verbindingen (Save-Data aan, of 2g/slow-2g) slaan we de video
 * helemaal over en tonen we alleen de poster. Scheelt megabytes.
 */
function useLightMode() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (!conn) return;

    const check = () =>
      setLight(
        Boolean(conn.saveData) ||
          conn.effectiveType === "2g" ||
          conn.effectiveType === "slow-2g"
      );

    check();
    const target = conn as unknown as EventTarget;
    target.addEventListener?.("change", check);
    return () => target.removeEventListener?.("change", check);
  }, []);

  return light;
}

export default function HeroBackgroundVideo({
  playbackId,
  poster,
  placeholder,
}: Props) {
  const lightMode = useLightMode();
  const [ready, setReady] = useState(false);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      {/* Laag 1: minipreview, meteen zichtbaar zonder extra request */}
      {placeholder && (
        <div
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 bg-cover bg-center blur-xl"
          style={{ backgroundImage: `url(${placeholder})` }}
        />
      )}

      {/* Laag 2: de video zelf. Blijft zichtbaar (opacity 0 zet Chrome muted
          autoplay stil), we faden de poster erboven weg. */}
      {!lightMode && (
        <MuxPlayer
          playbackId={playbackId}
          streamType="on-demand"
          autoPlay="muted"
          loop
          muted
          playsInline
          preload="auto"
          nohotkeys
          disableCookies
          placeholder={placeholder}
          onPlaying={() => setReady(true)}
          style={{
            "--controls": "none",
            "--media-object-fit": "cover",
            width: "100%",
            height: "100%",
            aspectRatio: "auto",
          }}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {/* Laag 3: scherpe poster (~60 kB webp) bovenop, weg zodra de video loopt */}
      <img
        src={poster}
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          ready && !lightMode ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}
