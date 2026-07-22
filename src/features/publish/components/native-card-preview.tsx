/**
 * Stylised per-platform post previews — the web port of the mobile app's
 * `NativeCardPreview` (ClipFlow/src/components/feature/publish/NativeCardPreview.tsx).
 * They approximate how the post reads on each surface so the user can preview
 * before publishing. Not pixel-perfect; each uses its platform's colour dialect.
 *
 * The caption shown is the REAL one that will be published — the backend builds
 * it from the video's title + description + hashtags (publish-job/_shared/
 * publishers.ts). So this preview is honest, not a mock text box.
 *
 * Brand hex is intentional (external brand colours, not theme tokens; the web
 * repo has no check:colors gate).
 */
"use client";

import { useT } from "@/lib/i18n/provider";
import type { PlatformId } from "@/lib/vidcica/network";

export type NativeCardPreviewProps = {
  platform: PlatformId;
  /** Account handle authoring the post (e.g. "@vidcica"). */
  handle: string;
  /** Caption body — title + description (no hashtags; those render separately). */
  caption: string;
  hashtags: string[];
  thumbnailUrl: string | null;
  /** YouTube only — Short card vs 16:9 video card. Default true (Short). */
  asShort?: boolean;
};

// ---- tiny inline glyphs (dependency-free, matching app-shell/icons.tsx) ----

function Glyph({
  d,
  size = 18,
  fill,
  stroke = "currentColor",
}: {
  d: string;
  size?: number;
  fill?: string;
  stroke?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ?? "none"}
      stroke={fill ? "none" : stroke}
      strokeWidth={fill ? undefined : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const HEART =
  "M12 20s-7-4.35-9.3-8.1C1 9 2.3 5.5 5.5 5.5c2 0 3.2 1.3 3.9 2.4h.2c.7-1.1 1.9-2.4 3.9-2.4 3.2 0 4.5 3.5 2.8 6.4C19 15.65 12 20 12 20z";
const COMMENT =
  "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z";
const SEND = "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z";
const BOOKMARK = "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z";
const MORE = "M5 12h.01M12 12h.01M19 12h.01";
const MUSIC =
  "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z";
const THUMB =
  "M7 10v11M18 10l-3.5-.5.8-3.8a1.5 1.5 0 0 0-2.9-.8L9 10H4v9a2 2 0 0 0 2 2h9.5a2 2 0 0 0 2-1.6l1.3-6.4A2 2 0 0 0 18 10z";
const REPEAT = "M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3";
const SHARE = "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13";

function Thumb({
  url,
  className,
  style,
}: {
  url: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote Supabase thumb; plain img avoids next/image domain config
    <img src={url} alt="" className={className} style={{ objectFit: "cover", ...style }} />
  ) : (
    <div className={className} style={{ background: "#1a1a1a", ...style }} />
  );
}

function Avatar({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, borderRadius: size, background: color, flexShrink: 0 }}
    />
  );
}

function tagLine(hashtags: string[], max = 4) {
  return hashtags.slice(0, max).join(" ");
}

// ---- per-platform cards ----

function InstagramCard({
  handle,
  caption,
  hashtags,
  thumbnailUrl,
}: Omit<NativeCardPreviewProps, "platform">) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #E8E8E8",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
        <Avatar color="#E1306C" />
        <span style={{ color: "#000", fontSize: 13, fontWeight: 600, flex: 1 }}>{handle}</span>
        <span style={{ color: "#000" }}>
          <Glyph d={MORE} size={16} />
        </span>
      </div>
      <Thumb url={thumbnailUrl} style={{ width: "100%", aspectRatio: "4 / 5" }} />
      <div style={{ display: "flex", gap: 14, padding: "10px 12px", color: "#000" }}>
        <Glyph d={HEART} size={20} /> <Glyph d={COMMENT} size={20} /> <Glyph d={SEND} size={20} />
        <span style={{ flex: 1 }} /> <Glyph d={BOOKMARK} size={20} />
      </div>
      <div style={{ padding: "0 12px 12px", color: "#000" }}>
        <p style={{ fontSize: 12, lineHeight: 1.35, margin: 0 }}>
          <span style={{ fontWeight: 700 }}>{handle} </span>
          {caption || "—"}
        </p>
        {hashtags.length > 0 && (
          <p style={{ fontSize: 12, color: "#00376B", marginTop: 4 }}>{tagLine(hashtags)}</p>
        )}
      </div>
    </div>
  );
}

function TikTokCard({
  handle,
  caption,
  hashtags,
  thumbnailUrl,
}: Omit<NativeCardPreviewProps, "platform">) {
  const t = useT();
  return (
    <div
      style={{
        position: "relative",
        background: "#000",
        borderRadius: 16,
        overflow: "hidden",
        aspectRatio: "9 / 16",
      }}
    >
      <Thumb
        url={thumbnailUrl}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 45%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 8,
          bottom: 76,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          color: "#fff",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: "rgba(255,255,255,0.18)",
            border: "2px solid #fff",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Glyph d={HEART} size={22} fill="#fff" />
          <span style={{ fontSize: 10, fontWeight: 600 }}>12,4K</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Glyph d={COMMENT} size={22} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>820</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Glyph d={SHARE} size={22} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>{t("publish.share")}</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 60,
          bottom: 12,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }}>{handle}</span>
        <span
          style={{
            fontSize: 12,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption || "—"}
        </span>
        {hashtags.length > 0 && (
          <span style={{ fontSize: 11, opacity: 0.9 }}>{tagLine(hashtags)}</span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Glyph d={MUSIC} size={11} fill="#fff" />
          <span style={{ fontSize: 10 }}>
            {t("publish.originalSound")} · {handle}
          </span>
        </span>
      </div>
    </div>
  );
}

function YouTubeShortsCard({
  handle,
  caption,
  hashtags,
  thumbnailUrl,
}: Omit<NativeCardPreviewProps, "platform">) {
  return (
    <div
      style={{
        position: "relative",
        background: "#0F0F0F",
        borderRadius: 16,
        overflow: "hidden",
        aspectRatio: "9 / 16",
      }}
    >
      <Thumb
        url={thumbnailUrl}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "3px 8px",
          borderRadius: 4,
          background: "#FF0000",
        }}
      >
        <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>SHORTS</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar color="#FF0000" size={28} />
          <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{handle}</span>
        </div>
        <span
          style={{
            fontSize: 12,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption || "—"}
        </span>
        {hashtags.length > 0 && (
          <span style={{ fontSize: 11, color: "#3EA6FF" }}>{tagLine(hashtags)}</span>
        )}
      </div>
    </div>
  );
}

function YouTubeVideoCard({
  handle,
  caption,
  hashtags,
  thumbnailUrl,
}: Omit<NativeCardPreviewProps, "platform">) {
  const t = useT();
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #E8E8E8",
      }}
    >
      <div style={{ position: "relative" }}>
        <Thumb
          url={thumbnailUrl}
          style={{ width: "100%", aspectRatio: "16 / 9", background: "#000" }}
        />
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            padding: "1px 4px",
            borderRadius: 4,
            background: "rgba(0,0,0,0.8)",
          }}
        >
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>0:30</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, padding: 12 }}>
        <Avatar color="#FF0000" />
        <div style={{ flex: 1 }}>
          <p
            style={{
              color: "#0F0F0F",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.3,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {caption || "—"}
          </p>
          <p style={{ color: "#606060", fontSize: 11, margin: "2px 0 0" }}>
            {handle} · {t("publish.justNow")}
          </p>
          {hashtags.length > 0 && (
            <p style={{ color: "#3EA6FF", fontSize: 11, margin: "2px 0 0" }}>{tagLine(hashtags)}</p>
          )}
        </div>
        <span style={{ color: "#606060" }}>
          <Glyph d={MORE} size={16} />
        </span>
      </div>
    </div>
  );
}

function LinkedInCard({
  handle,
  caption,
  hashtags,
  thumbnailUrl,
}: Omit<NativeCardPreviewProps, "platform">) {
  const t = useT();
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #E8E8E8",
      }}
    >
      <div style={{ display: "flex", gap: 10, padding: 12, alignItems: "center" }}>
        <Avatar color="#0A66C2" size={40} />
        <div style={{ flex: 1 }}>
          <p style={{ color: "#000", fontSize: 13, fontWeight: 700, margin: 0 }}>{handle}</p>
          <p style={{ color: "#666", fontSize: 11, margin: 0 }}>
            {t("publish.contentCreator")} · {t("publish.justNow")}
          </p>
        </div>
        <span style={{ color: "#666" }}>
          <Glyph d={MORE} size={16} />
        </span>
      </div>
      <div style={{ padding: "0 12px 10px" }}>
        <p
          style={{
            color: "#000",
            fontSize: 13,
            lineHeight: 1.4,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption || "—"}
        </p>
        {hashtags.length > 0 && (
          <p style={{ color: "#0A66C2", fontSize: 12, marginTop: 4 }}>{tagLine(hashtags, 5)}</p>
        )}
      </div>
      <Thumb url={thumbnailUrl} style={{ width: "100%", aspectRatio: "16 / 9" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 0",
          borderTop: "1px solid #EEE",
          color: "#666",
        }}
      >
        <ActionLabel d={THUMB} label={t("publish.like")} />
        <ActionLabel d={COMMENT} label={t("publish.comment")} />
        <ActionLabel d={REPEAT} label={t("publish.repost")} />
        <ActionLabel d={SEND} label={t("publish.send")} />
      </div>
    </div>
  );
}

function FacebookCard({
  handle,
  caption,
  hashtags,
  thumbnailUrl,
}: Omit<NativeCardPreviewProps, "platform">) {
  const t = useT();
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #E4E6EB",
      }}
    >
      <div style={{ display: "flex", gap: 10, padding: 12, alignItems: "center" }}>
        <Avatar color="#1877F2" size={40} />
        <div style={{ flex: 1 }}>
          <p style={{ color: "#050505", fontSize: 13, fontWeight: 700, margin: 0 }}>{handle}</p>
          <p style={{ color: "#65676B", fontSize: 11, margin: 0 }}>{t("publish.justNow")} · 🌍</p>
        </div>
      </div>
      <div style={{ padding: "0 12px 8px" }}>
        <p
          style={{
            color: "#050505",
            fontSize: 13,
            lineHeight: 1.4,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption || "—"}
        </p>
        {hashtags.length > 0 && (
          <p style={{ color: "#1877F2", fontSize: 12, marginTop: 4 }}>{tagLine(hashtags)}</p>
        )}
      </div>
      <Thumb url={thumbnailUrl} style={{ width: "100%", aspectRatio: "4 / 3" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0",
          borderTop: "1px solid #E4E6EB",
          color: "#65676B",
        }}
      >
        <ActionLabel d={THUMB} label={t("publish.like")} />
        <ActionLabel d={COMMENT} label={t("publish.comment")} />
        <ActionLabel d={SHARE} label={t("publish.share")} />
      </div>
    </div>
  );
}

function ThreadsCard({
  handle,
  caption,
  hashtags,
  thumbnailUrl,
}: Omit<NativeCardPreviewProps, "platform">) {
  const t = useT();
  return (
    <div style={{ background: "#000", borderRadius: 16, overflow: "hidden", padding: 12 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Avatar color="#fff" size={36} />
        <div style={{ flex: 1, color: "#fff" }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{handle}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>
            {t("publish.justNow")}
          </p>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              marginTop: 4,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {caption || "—"}
          </p>
          {hashtags.length > 0 && (
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
              {tagLine(hashtags, 3)}
            </p>
          )}
          <Thumb
            url={thumbnailUrl}
            style={{
              width: "100%",
              aspectRatio: "4 / 5",
              borderRadius: 14,
              marginTop: 6,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
            <Glyph d={HEART} size={18} />
            <Glyph d={COMMENT} size={18} />
            <Glyph d={REPEAT} size={18} />
            <Glyph d={SEND} size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionLabel({ d, label }: { d: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
      <Glyph d={d} size={14} />
      {label}
    </span>
  );
}

/** Renders the stylised native post card for a platform. */
export function NativeCardPreview({ platform, asShort = true, ...rest }: NativeCardPreviewProps) {
  switch (platform) {
    case "tiktok":
      return <TikTokCard {...rest} />;
    case "youtube":
      return asShort ? <YouTubeShortsCard {...rest} /> : <YouTubeVideoCard {...rest} />;
    case "linkedin":
      return <LinkedInCard {...rest} />;
    case "facebook":
      return <FacebookCard {...rest} />;
    case "threads":
      return <ThreadsCard {...rest} />;
    case "instagram":
    default:
      return <InstagramCard {...rest} />;
  }
}
