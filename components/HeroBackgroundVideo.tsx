"use client";

import MuxPlayer from "@mux/mux-player-react";

type Props = {
  playbackId: string;
  poster: string;
};

export default function HeroBackgroundVideo({ playbackId, poster }: Props) {
  return (
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
      poster={poster}
      style={{
        "--controls": "none",
        "--media-object-fit": "cover",
        width: "100%",
        height: "100%",
        aspectRatio: "auto",
      }}
      className="absolute inset-0 h-full w-full"
    />
  );
}
