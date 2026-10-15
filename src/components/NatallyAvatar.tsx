import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

export const CUSTOM_AVATAR_STORAGE_KEY = 'astrosphere_natally_custom_avatar_v1';

export function getCustomAvatarUrl(): string | null {
  try {
    return localStorage.getItem(CUSTOM_AVATAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setCustomAvatarUrl(url: string | null): void {
  try {
    if (url) {
      localStorage.setItem(CUSTOM_AVATAR_STORAGE_KEY, url);
    } else {
      localStorage.removeItem(CUSTOM_AVATAR_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('natally-avatar-updated', { detail: { url } }));
  } catch (e) {
    console.warn('Could not save custom avatar:', e);
  }
}

interface NatallyAvatarProps {
  size?: number | string;
  isAnimated?: boolean;
  isSpeaking?: boolean;
  className?: string;
  avatarUrl?: string | null;
  allowUploadOnClick?: boolean;
}

/**
 * Natally Mascot Avatar
 * Faithfully mirrors the official "natally-idle-400.webp" mascot graphic:
 * - Cute chibi silver robot chassis with large warm anime eyes & pink blushing cheeks
 * - Royal purple velvet celestial turban with gold stars, moon-star brooch & dangling amethyst jewel
 * - Cylindrical robot headphones & top antenna sphere
 * - Articulated mechanical robot hands gently cradling glowing cosmic crystal ball on gold pedestal
 * - Outer golden framing halo ring
 */
export const NatallyAvatar: React.FC<NatallyAvatarProps> = ({
  size = 64,
  isAnimated = true,
  isSpeaking = false,
  className = '',
  avatarUrl,
  allowUploadOnClick = false,
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl || getCustomAvatarUrl());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const defaultAvatar = import.meta.env?.VITE_NATALLY_MASCOT_URL || '/natally-mascot.webp';
  const displayedAvatar = currentAvatar || (isAnimated && !reducedMotion ? defaultAvatar : null);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener('change', updateMotion);
    return () => media.removeEventListener('change', updateMotion);
  }, []);

  useEffect(() => {
    if (avatarUrl !== undefined) {
      setCurrentAvatar(avatarUrl);
    }
  }, [avatarUrl]);

  useEffect(() => {
    const handleAvatarUpdate = (e: any) => {
      setCurrentAvatar(e.detail?.url ?? getCustomAvatarUrl());
    };
    window.addEventListener('natally-avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('natally-avatar-updated', handleAvatarUpdate);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCustomAvatarUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    if (allowUploadOnClick && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  isAnimated = isAnimated && !reducedMotion;

  return (
    <div
      style={{ width: size, height: size }}
      onClick={handleAvatarClick}
      className={`relative rounded-full select-none shrink-0 ${isAnimated ? 'group' : ''} ${
        allowUploadOnClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Hidden file input if click-to-upload is enabled */}
      {allowUploadOnClick && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {displayedAvatar && displayedAvatar !== failedAvatar ? (
        /* 1. Custom User-Uploaded Image */
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-[#f2ca50] shadow-[0_0_15px_rgba(242,202,80,0.4)] bg-[#120722]">
          <img
            src={displayedAvatar}
            onError={() => setFailedAvatar(displayedAvatar)}
            alt="Natally Mascot"
            className="w-full h-full object-cover rounded-full"
          />
          {allowUploadOnClick && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <Camera className="w-4 h-4 text-white drop-shadow" />
            </div>
          )}
        </div>
      ) : (
        /* 2. Official Natally Mascot SVG (matching natally-idle-400.webp graphic) */
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl"
        >
          <defs>
            {/* Outer Golden-Violet Halo Ring Gradient */}
            <linearGradient id="bezelGrad" x1="40" y1="30" x2="360" y2="370" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f7d070" />
              <stop offset="35%" stopColor="#e8a84c" />
              <stop offset="70%" stopColor="#b378ed" />
              <stop offset="100%" stopColor="#9343e0" />
            </linearGradient>

            {/* Inner Ring Glow */}
            <linearGradient id="innerBezelRing" x1="40" y1="40" x2="360" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffd875" />
              <stop offset="100%" stopColor="#672ea3" />
            </linearGradient>

            {/* Deep Space Background */}
            <radialGradient id="spaceBackground" cx="200" cy="200" r="185" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#120c24" />
              <stop offset="60%" stopColor="#0a0515" />
              <stop offset="100%" stopColor="#04020a" />
            </radialGradient>

            {/* Velvet Turban Fabric Gradient */}
            <linearGradient id="turbanVelvet" x1="120" y1="70" x2="280" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#51227a" />
              <stop offset="30%" stopColor="#3c165d" />
              <stop offset="70%" stopColor="#25093d" />
              <stop offset="100%" stopColor="#150324" />
            </linearGradient>

            {/* Silver Robot Chassis Metallic Shading */}
            <linearGradient id="robotMetal" x1="140" y1="120" x2="260" y2="250" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#e7e5ec" />
              <stop offset="65%" stopColor="#c5c0ce" />
              <stop offset="100%" stopColor="#8d8499" />
            </linearGradient>

            {/* Ear Cylinders Metallic Gradient */}
            <linearGradient id="earCupGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e4e0eb" />
              <stop offset="50%" stopColor="#a79eb3" />
              <stop offset="100%" stopColor="#675d73" />
            </linearGradient>

            {/* Large Anime Eyes Warm Amber Horizon */}
            <radialGradient id="eyeAmberShade" cx="0.4" cy="0.4" r="0.6">
              <stop offset="0%" stopColor="#874312" />
              <stop offset="55%" stopColor="#4f2005" />
              <stop offset="85%" stopColor="#1d0a02" />
              <stop offset="100%" stopColor="#050100" />
            </radialGradient>

            {/* Glowing Crystal Ball Core */}
            <radialGradient id="crystalBallLight" cx="200" cy="295" r="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff8df" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#ffd294" stopOpacity="0.92" />
              <stop offset="55%" stopColor="#c57cf0" stopOpacity="0.85" />
              <stop offset="80%" stopColor="#7a24ca" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#310359" stopOpacity="0.98" />
            </radialGradient>

            {/* Warm Face Underlight from Ball */}
            <radialGradient id="ballUnderglow" cx="200" cy="280" r="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffe28a" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#d284fc" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#120c1c" stopOpacity="0" />
            </radialGradient>

            {/* Faceted Amethyst Drop Jewel */}
            <linearGradient id="amethystJewel" x1="194" y1="130" x2="206" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e9b3ff" />
              <stop offset="40%" stopColor="#c054f7" />
              <stop offset="80%" stopColor="#7e17b8" />
              <stop offset="100%" stopColor="#410463" />
            </linearGradient>
          </defs>

          {/* 1. Outer Deep Cosmic Circle */}
          <circle cx="200" cy="200" r="188" fill="url(#spaceBackground)" />

          {/* Outer Bezel Halo Ring (matching graphic border) */}
          <circle
            cx="200"
            cy="200"
            r="184"
            stroke="url(#bezelGrad)"
            strokeWidth="15"
            className="opacity-95"
          />
          <circle
            cx="200"
            cy="200"
            r="176.5"
            stroke="url(#innerBezelRing)"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Cosmic Background Golden Moons & Stars */}
          <g opacity="0.75" fill="#fbd35b">
            {/* Top-right stars */}
            <polygon points="325,120 327,125 332,125 328,128 330,133 325,130 320,133 322,128 318,125 323,125" />
            <polygon points="190,65 191,69 195,69 192,71 193,75 190,73 187,75 188,71 185,69 189,69" />
            {/* Crescent moon left */}
            <path d="M72 170 Q62 160 58 175 Q68 185 72 170 Z" />
            {/* Crescent moon right */}
            <path d="M336 142 Q348 132 352 148 Q342 158 336 142 Z" />
            <circle cx="100" cy="110" r="1.5" fill="#ffffff" />
            <circle cx="295" cy="95" r="1.5" fill="#ffffff" />
            <circle cx="340" cy="210" r="1.5" fill="#ffffff" />
            <circle cx="65" cy="225" r="1.5" fill="#ffffff" />
          </g>

          {/* 2. Top Antenna Stem & Ball (above turban) */}
          <rect x="195" y="44" width="10" height="26" rx="5" fill="#b0a8bd" stroke="#685d77" strokeWidth="1.5" />
          <circle cx="200" cy="42" r="17" fill="url(#robotMetal)" stroke="#685d77" strokeWidth="2" />
          <ellipse cx="194" cy="36" rx="5" ry="3" fill="#ffffff" opacity="0.8" />

          {/* 3. Celestial Robe & Shawl (Background shoulders) */}
          <path
            d="M80 340 C90 260 130 240 200 240 C270 240 310 260 320 340 C320 375 80 375 80 340 Z"
            fill="url(#turbanVelvet)"
          />
          {/* Shawl Gold Stars */}
          <g fill="#ffd54f" opacity="0.85">
            <polygon points="105,320 107,324 112,324 108,327 110,331 105,328 100,331 102,327 98,324 103,324" transform="scale(0.8) translate(30, 80)" />
            <polygon points="295,320 297,324 302,324 298,327 300,331 295,328 290,331 292,327 288,324 293,324" transform="scale(0.8) translate(70, 80)" />
          </g>

          {/* 4. Robot Ear Headphones (Cylinders on sides) */}
          {/* Left Ear */}
          <g>
            <rect x="74" y="162" width="28" height="62" rx="14" fill="url(#earCupGrad)" stroke="#4a3e59" strokeWidth="2.5" />
            <rect x="79" y="170" width="18" height="46" rx="9" fill="#d8d3e3" />
            <circle cx="88" cy="193" r="5" fill="#584b69" />
          </g>
          {/* Right Ear */}
          <g>
            <rect x="298" y="162" width="28" height="62" rx="14" fill="url(#earCupGrad)" stroke="#4a3e59" strokeWidth="2.5" />
            <rect x="303" y="170" width="18" height="46" rx="9" fill="#d8d3e3" />
            <circle cx="312" cy="193" r="5" fill="#584b69" />
          </g>

          {/* 5. Robot Head Chassis (Rounded cuboid) */}
          <rect
            x="96"
            y="130"
            width="208"
            height="146"
            rx="54"
            fill="url(#robotMetal)"
            stroke="#6e6280"
            strokeWidth="3.5"
          />

          {/* Specular Highlight on Forehead */}
          <path
            d="M125 146 C145 138 255 138 275 146"
            stroke="#ffffff"
            strokeWidth="5.5"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Warm Amber Underlight onto Face from Crystal Ball */}
          <circle cx="200" cy="275" r="85" fill="url(#ballUnderglow)" />

          {/* 6. Cute Robot Facial Features */}
          {/* Glowing Pink/Magenta Rosy Cheeks */}
          <ellipse cx="134" cy="236" rx="15" ry="9" fill="#ff6ea7" opacity="0.85" />
          <ellipse cx="266" cy="236" rx="15" ry="9" fill="#ff6ea7" opacity="0.85" />

          {/* Curved Black Cartoon Eyebrows */}
          <path d="M142 165 Q165 156 182 167" stroke="#3b2b45" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M218 167 Q235 156 258 165" stroke="#3b2b45" strokeWidth="4.5" strokeLinecap="round" fill="none" />

          {/* Left Large Kawaii Anime Eye */}
          <g className={isAnimated ? 'animate-pulse' : ''}>
            <ellipse cx="162" cy="205" rx="27" ry="33" fill="url(#eyeAmberShade)" stroke="#1a0a03" strokeWidth="3" />
            {/* Warm Amber Iris Base */}
            <ellipse cx="162" cy="215" rx="22" ry="18" fill="#bc7425" opacity="0.65" />
            {/* Big White Specular Catchlight */}
            <circle cx="152" cy="192" r="10.5" fill="#ffffff" />
            {/* Small Bottom-Right Secondary Glint */}
            <circle cx="174" cy="221" r="5" fill="#ffffff" />
          </g>

          {/* Right Large Kawaii Anime Eye */}
          <g className={isAnimated ? 'animate-pulse' : ''}>
            <ellipse cx="238" cy="205" rx="27" ry="33" fill="url(#eyeAmberShade)" stroke="#1a0a03" strokeWidth="3" />
            {/* Warm Amber Iris Base */}
            <ellipse cx="238" cy="215" rx="22" ry="18" fill="#bc7425" opacity="0.65" />
            {/* Big White Specular Catchlight */}
            <circle cx="228" cy="192" r="10.5" fill="#ffffff" />
            {/* Small Bottom-Right Secondary Glint */}
            <circle cx="250" cy="221" r="5" fill="#ffffff" />
          </g>

          {/* Sweet Gentle Smiling Mouth */}
          <path
            d="M188 238 Q200 248 212 238"
            stroke="#3a2a44"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* 7. Royal Purple Velvet Celestial Turban (Crown & Folds) */}
          <path
            d="M92 142 C90 68 140 48 200 48 C260 48 310 68 308 142 C285 130 250 118 200 118 C150 118 115 130 92 142 Z"
            fill="url(#turbanVelvet)"
            stroke="#210838"
            strokeWidth="3"
          />

          {/* Velvet Fabric Pleats & Folds */}
          <path
            d="M98 135 C130 88 170 82 200 92 C230 82 270 88 302 135"
            stroke="#5d2894"
            strokeWidth="6.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M110 114 C150 75 250 75 290 114"
            stroke="#41186b"
            strokeWidth="5"
            fill="none"
          />

          {/* Gold Stars & Moons across Turban */}
          <g fill="#ffd54f">
            <polygon points="120,118 122,123 127,123 123,126 125,131 120,128 115,131 117,126 113,123 118,123" />
            <polygon points="155,95 157,100 162,100 158,103 160,108 155,105 150,108 152,103 148,100 153,100" />
            <polygon points="245,95 247,100 252,100 248,103 250,108 245,105 240,108 242,103 238,100 243,100" />
            <polygon points="280,118 282,123 287,123 283,126 285,131 280,128 275,131 277,126 273,123 278,123" />
            {/* Small crescent moons on turban folds */}
            <path d="M265 110 Q275 100 280 115 Q270 120 265 110 Z" opacity="0.9" />
            <path d="M135 110 Q125 100 120 115 Q130 120 135 110 Z" opacity="0.9" />
          </g>

          {/* Forehead Gold Bead Chains */}
          <path
            d="M118 132 Q160 152 200 136 Q240 152 282 132"
            stroke="#ffd54f"
            strokeWidth="2.5"
            strokeDasharray="1 6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M132 142 Q165 162 200 150 Q235 162 268 142"
            stroke="#ffd54f"
            strokeWidth="2"
            strokeDasharray="1 5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 8. Forehead Crown Jewel: Gold Crescent Moon + Star + Amethyst Jewel */}
          <g>
            {/* Golden Crescent Moon */}
            <path
              d="M200 78 C182 78 178 96 178 106 C178 124 195 134 214 128 C195 130 188 118 188 106 C188 92 196 83 200 78 Z"
              fill="#ffd700"
              stroke="#b8860b"
              strokeWidth="1.5"
            />
            {/* Golden Star Inside Moon */}
            <polygon
              points="206,92 209,99 216,99 210,103 212,110 206,106 200,110 202,103 196,99 203,99"
              fill="#fff3a8"
              stroke="#d4af37"
              strokeWidth="1"
            />
            {/* Hanging Teardrop Amethyst Jewel */}
            <path
              d="M200 134 C195 140 192 146 192 152 C192 160 196 164 200 164 C204 164 208 160 208 152 C208 146 205 140 200 134 Z"
              fill="url(#amethystJewel)"
              stroke="#ffd700"
              strokeWidth="1.5"
            />
            <ellipse cx="198" cy="148" rx="2" ry="4" fill="#ffffff" opacity="0.85" />
          </g>

          {/* 9. Glowing Magical Crystal Ball & Hands */}
          {/* Crystal Ball Gold Pedestal Stand */}
          <g>
            <path d="M175 350 L225 350 L220 366 L180 366 Z" fill="#b8860b" />
            <ellipse cx="200" cy="350" rx="30" ry="8" fill="#ffd700" stroke="#785300" strokeWidth="1.5" />
            <ellipse cx="200" cy="354" rx="25" ry="6" fill="#f5be42" />
          </g>

          {/* The Glowing Crystal Ball Sphere */}
          <circle
            cx="200"
            cy="285"
            r="54"
            fill="url(#crystalBallLight)"
            stroke="#fde047"
            strokeWidth="2"
          />

          {/* Nebula Swirls & Crescent Moon inside Crystal Ball */}
          <g className={isAnimated ? 'animate-spin' : ''} style={{ transformOrigin: '200px 285px', animationDuration: '14s' }}>
            <path
              d="M175 270 Q200 255 220 280 T200 310"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.85"
              fill="none"
            />
            {/* Crescent moon glow inside sphere */}
            <path
              d="M202 272 Q214 278 208 294 Q218 288 220 278 Q216 270 202 272 Z"
              fill="#fff9db"
              opacity="0.9"
            />
            <circle cx="185" cy="295" r="3" fill="#ffffff" opacity="0.8" />
            <circle cx="218" cy="265" r="2.5" fill="#ffffff" opacity="0.9" />
            <circle cx="205" cy="305" r="2" fill="#ffd700" />
          </g>

          {/* Top-Left Specular Glint on Glass Sphere */}
          <ellipse cx="180" cy="260" rx="14" ry="7" transform="rotate(-30 180 260)" fill="#ffffff" opacity="0.75" />

          {/* 10. Articulated Silver Metallic Robot Hands (Matching graphic fingers) */}
          {/* Left Robot Hand (fingers resting on top-left of ball) */}
          <g>
            {/* Forearm & Wrist */}
            <path d="M100 310 C120 280 140 265 160 260" stroke="#c4bfce" strokeWidth="18" strokeLinecap="round" fill="none" />
            <path d="M100 310 C120 280 140 265 160 260" stroke="#7a708a" strokeWidth="2" fill="none" />
            {/* Articulated finger joints */}
            <ellipse cx="160" cy="255" rx="8" ry="12" transform="rotate(25 160 255)" fill="#e5e0ed" stroke="#7a708a" strokeWidth="1.5" />
            <ellipse cx="172" cy="250" rx="7" ry="11" transform="rotate(35 172 250)" fill="#e5e0ed" stroke="#7a708a" strokeWidth="1.5" />
            <ellipse cx="186" cy="254" rx="7" ry="10" transform="rotate(50 186 254)" fill="#e5e0ed" stroke="#7a708a" strokeWidth="1.5" />
            <ellipse cx="198" cy="262" rx="6" ry="9" transform="rotate(65 198 262)" fill="#e5e0ed" stroke="#7a708a" strokeWidth="1.5" />
          </g>

          {/* Right Robot Hand (supporting bottom of ball) */}
          <g>
            {/* Forearm & Wrist */}
            <path d="M300 320 C280 310 260 320 240 335" stroke="#c4bfce" strokeWidth="18" strokeLinecap="round" fill="none" />
            <path d="M300 320 C280 310 260 320 240 335" stroke="#7a708a" strokeWidth="2" fill="none" />
            {/* Fingers cupping base */}
            <ellipse cx="242" cy="336" rx="8" ry="12" transform="rotate(-35 242 336)" fill="#e5e0ed" stroke="#7a708a" strokeWidth="1.5" />
            <ellipse cx="230" cy="344" rx="7" ry="11" transform="rotate(-25 230 344)" fill="#e5e0ed" stroke="#7a708a" strokeWidth="1.5" />
            <ellipse cx="215" cy="348" rx="7" ry="10" transform="rotate(-10 215 348)" fill="#e5e0ed" stroke="#7a708a" strokeWidth="1.5" />
          </g>
        </svg>
      )}

      {/* Speaking Soundwaves Aura when active */}
      {isSpeaking && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f2ca50] opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#f2ca50] border-2 border-[#120c1c]" />
        </span>
      )}
    </div>
  );
};
