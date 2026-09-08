/**
 * Scene geometry for the approved "AURA Threshold" design.
 *
 * Every value here is transcribed verbatim from the approved design file. The
 * decorative layers are data rather than markup because each one is a unique
 * position/clip/gradient triple — expressing them as arrays keeps the
 * component readable and makes the composition tunable in one place.
 *
 * The scene is authored against a 1440x900 stage; both worlds are 560x900
 * boxes pinned to opposite edges and uniformly scaled by --world-scale.
 */

/** A positioned decorative layer. `enter` selects its entrance keyframe. */
export interface SceneLayer {
  readonly id: string;
  readonly enter: "fade" | "shardL" | "shardR";
  readonly dur: string;
  readonly delay: string;
  readonly style: Readonly<Record<string, string | number>>;
}

/** A crimson fracture line. */
export interface Fracture {
  readonly id: string;
  readonly style: Readonly<Record<string, string | number>>;
}

const fracture = (
  id: string,
  left: string,
  top: string,
  width: string,
  rotate: string,
  colour: string,
  stop: string,
  opacity: number,
  glow?: string,
): Fracture => ({
  id,
  style: {
    left,
    top,
    width,
    transform: `rotate(${rotate})`,
    background: `linear-gradient(90deg,rgba(192,24,42,0),${colour} ${stop},rgba(192,24,42,0))`,
    "--frac-o": opacity,
    ...(glow ? { boxShadow: glow } : {}),
  },
});

/* ====================================================================== */
/* QUICK — the crystal world                                              */
/* ====================================================================== */

export const QUICK_LAYERS: readonly SceneLayer[] = [
  {
    id: "q-glow-cold",
    enter: "fade",
    dur: "1.6s",
    delay: "0.2s",
    style: {
      left: "-130px",
      top: "110px",
      width: "600px",
      height: "720px",
      background: "radial-gradient(58% 48% at 32% 58%,#15141b 0%,rgba(21,20,27,0) 72%)",
      filter: "blur(32px)",
    },
  },
  {
    id: "q-glow-ember",
    enter: "fade",
    dur: "2s",
    delay: "1.1s",
    style: {
      left: "-30px",
      top: "640px",
      width: "440px",
      height: "300px",
      background: "radial-gradient(50% 50% at 42% 62%,rgba(154,20,34,.17),rgba(154,20,34,0) 70%)",
      filter: "blur(26px)",
    },
  },
  {
    id: "q-shard-1",
    enter: "shardL",
    dur: "1.5s",
    delay: "0.2s",
    style: {
      left: "-90px",
      top: "96px",
      width: "430px",
      height: "800px",
      clipPath: "polygon(0% 14%,46% 0%,100% 38%,86% 100%,0% 100%)",
      background: "linear-gradient(162deg,#0f0f14 0%,#08080b 68%)",
    },
  },
  {
    id: "q-shard-2",
    enter: "shardL",
    dur: "1.5s",
    delay: "0.42s",
    style: {
      left: "196px",
      top: "-50px",
      width: "158px",
      height: "540px",
      clipPath: "polygon(42% 0%,100% 20%,74% 100%,0% 72%)",
      background: "linear-gradient(198deg,#13131a 0%,#0a0a0e 74%)",
    },
  },
  {
    id: "q-shard-3",
    enter: "shardL",
    dur: "1.6s",
    delay: "0.42s",
    style: {
      left: "-70px",
      top: "420px",
      width: "540px",
      height: "530px",
      clipPath: "polygon(0% 24%,52% 0%,100% 30%,100% 100%,0% 100%)",
      background: "linear-gradient(148deg,#14141a 0%,#08080b 62%)",
    },
  },
  {
    id: "q-shard-4",
    enter: "shardL",
    dur: "1.3s",
    delay: "0.82s",
    style: {
      left: "344px",
      top: "296px",
      width: "132px",
      height: "104px",
      clipPath: "polygon(0% 42%,62% 0%,100% 58%,30% 100%)",
      background: "linear-gradient(140deg,#1d1c22 0%,#0b0b0f 78%)",
    },
  },
  {
    id: "q-shard-5",
    enter: "shardL",
    dur: "1.3s",
    delay: "0.95s",
    style: {
      left: "408px",
      top: "520px",
      width: "84px",
      height: "66px",
      clipPath: "polygon(0% 38%,58% 0%,100% 62%,34% 100%)",
      background: "linear-gradient(140deg,#191820 0%,#0a0a0e 78%)",
    },
  },
];

/** Shards that sit IN FRONT of the crystal, occluding its base. */
export const QUICK_FOREGROUND: readonly SceneLayer[] = [
  {
    id: "q-fore-1",
    enter: "shardL",
    dur: "1.5s",
    delay: "0.82s",
    style: {
      left: "-50px",
      top: "600px",
      width: "470px",
      height: "340px",
      zIndex: 6,
      clipPath: "polygon(0% 32%,36% 4%,100% 44%,100% 100%,0% 100%)",
      background: "linear-gradient(160deg,#06060a,#030305)",
    },
  },
  {
    id: "q-fore-2",
    enter: "shardL",
    dur: "1.4s",
    delay: "0.95s",
    style: {
      left: "300px",
      top: "742px",
      width: "210px",
      height: "200px",
      zIndex: 6,
      clipPath: "polygon(0% 46%,44% 0%,100% 36%,100% 100%,0% 100%)",
      background: "linear-gradient(150deg,#0a0a0f,#040406)",
    },
  },
];

export const QUICK_FRACTURES: readonly Fracture[] = [
  fracture("f1", "24px", "250px", "230px", "28deg", "#c0182a", "55%", 0.5, "0 0 9px rgba(192,24,42,.45)"),
  fracture("f2", "126px", "470px", "300px", "-19deg", "#a5121f", "60%", 0.42, "0 0 8px rgba(165,18,31,.4)"),
  fracture("f3", "-10px", "706px", "250px", "11deg", "#c0182a", "50%", 0.55, "0 0 10px rgba(192,24,42,.5)"),
  fracture("f4", "348px", "326px", "120px", "-38deg", "#e06a4a", "50%", 0.6, "0 0 8px rgba(224,106,74,.4)"),
  fracture("f5", "236px", "96px", "150px", "58deg", "#8e0f1a", "60%", 0.4),
  fracture("f6", "60px", "588px", "180px", "-6deg", "#b0141f", "55%", 0.35, "0 0 7px rgba(176,20,31,.35)"),
];

/** Fractures running across the crystal's own face. */
export const QUICK_INNER_FRACTURES: readonly Fracture[] = [
  fracture("i1", "6%", "26%", "88%", "11deg", "#c0182a", "46%", 0.42),
  fracture("i2", "2%", "70%", "74%", "-8deg", "#a1111e", "52%", 0.32),
  fracture("i3", "58%", "6%", "52%", "74deg", "#c8543a", "50%", 0.28),
  fracture("i4", "-6%", "46%", "46%", "58deg", "#8e0f1a", "55%", 0.24),
];

/* ====================================================================== */
/* STAY — the garden world                                                */
/* ====================================================================== */

export const STAY_LAYERS: readonly SceneLayer[] = [
  {
    id: "s-glow-warm",
    enter: "fade",
    dur: "1.8s",
    delay: "0.2s",
    style: {
      right: "-120px",
      top: "-140px",
      width: "600px",
      height: "560px",
      background: "radial-gradient(50% 50% at 64% 34%,rgba(238,197,148,.11),rgba(238,197,148,0) 70%)",
      filter: "blur(14px)",
    },
  },
  {
    id: "s-glow-canopy",
    enter: "fade",
    dur: "1.8s",
    delay: "0.2s",
    style: {
      right: "-70px",
      top: "60px",
      width: "540px",
      height: "600px",
      background: "radial-gradient(58% 54% at 62% 42%,#1a2018 0%,rgba(26,32,24,0) 72%)",
      filter: "blur(28px)",
    },
  },
  {
    id: "s-glow-floor",
    enter: "fade",
    dur: "1.8s",
    delay: "0.42s",
    style: {
      right: "-40px",
      bottom: "-60px",
      width: "480px",
      height: "320px",
      background: "radial-gradient(50% 50% at 52% 62%,#1e2a1b 0%,rgba(30,42,27,0) 70%)",
      filter: "blur(22px)",
    },
  },
  {
    id: "s-glow-moss",
    enter: "fade",
    dur: "1.8s",
    delay: "0.55s",
    style: {
      right: "140px",
      bottom: "-30px",
      width: "300px",
      height: "220px",
      background: "radial-gradient(50% 50% at 50% 60%,#25321f 0%,rgba(37,50,31,0) 68%)",
      filter: "blur(18px)",
    },
  },
  {
    id: "s-stone-1",
    enter: "shardR",
    dur: "1.5s",
    delay: "0.55s",
    style: {
      right: "34px",
      bottom: "96px",
      width: "250px",
      height: "78px",
      borderRadius: "50%",
      background: "linear-gradient(180deg,#2b2823 0%,#131310 100%)",
      filter: "blur(1.5px)",
    },
  },
  {
    id: "s-stone-2",
    enter: "shardR",
    dur: "1.5s",
    delay: "0.68s",
    style: {
      right: "236px",
      bottom: "140px",
      width: "150px",
      height: "52px",
      borderRadius: "50%",
      background: "linear-gradient(180deg,#26241f 0%,#111110 100%)",
      filter: "blur(2.5px)",
    },
  },
];

/** Sits after the stone in paint order. */
export const STAY_UNDERGLOW: SceneLayer = {
  id: "s-glow-under",
  enter: "fade",
  dur: "1.8s",
  delay: "0.68s",
  style: {
    right: "80px",
    bottom: "290px",
    width: "280px",
    height: "170px",
    background: "radial-gradient(50% 50% at 50% 60%,#233019,rgba(35,48,25,0) 70%)",
    filter: "blur(18px)",
  },
};

export interface Leaf {
  readonly id: string;
  readonly style: Readonly<Record<string, string | number>>;
}

/**
 * Foreground foliage. `--leaf-hot-*` is the displacement applied when the
 * garden notices you; alternating signs keep the response from reading as one
 * rigid block sliding.
 */
export const STAY_LEAVES: readonly Leaf[] = [
  {
    id: "l1",
    style: {
      right: "296px",
      bottom: "366px",
      width: "104px",
      height: "40px",
      background: "linear-gradient(120deg,#2c3a26,#161d13)",
      filter: "blur(.6px)",
      transitionDuration: "1.3s",
      "--leaf-rot": "-21deg",
      "--leaf-hot-x": "3px",
      "--leaf-hot-y": "-4px",
      "--leaf-hot-rot": "1.6deg",
    },
  },
  {
    id: "l2",
    style: {
      right: "108px",
      bottom: "352px",
      width: "126px",
      height: "46px",
      background: "linear-gradient(120deg,#243020,#12180f)",
      filter: "blur(1.4px)",
      transitionDuration: "1.5s",
      "--leaf-rot": "10deg",
      "--leaf-hot-x": "-3px",
      "--leaf-hot-y": "-2px",
      "--leaf-hot-rot": "-1.4deg",
    },
  },
  {
    id: "l3",
    style: {
      right: "26px",
      bottom: "432px",
      width: "86px",
      height: "32px",
      background: "linear-gradient(120deg,#2f3d28,#171e14)",
      filter: "blur(1px)",
      transitionDuration: "1.4s",
      "--leaf-rot": "26deg",
      "--leaf-hot-x": "3px",
      "--leaf-hot-y": "-4px",
      "--leaf-hot-rot": "1.6deg",
    },
  },
  {
    id: "l4",
    style: {
      right: "56px",
      bottom: "94px",
      width: "124px",
      height: "46px",
      background: "linear-gradient(120deg,#28351f,#11170e)",
      filter: "blur(2.2px)",
      transitionDuration: "1.6s",
      "--leaf-rot": "-6deg",
      "--leaf-hot-x": "-3px",
      "--leaf-hot-y": "-2px",
      "--leaf-hot-rot": "-1.4deg",
    },
  },
  {
    id: "l5",
    style: {
      right: "196px",
      bottom: "42px",
      width: "156px",
      height: "58px",
      background: "linear-gradient(120deg,#1d2719,#0c110a)",
      filter: "blur(3.4px)",
      transitionDuration: "1.7s",
      "--leaf-rot": "4deg",
      "--leaf-hot-x": "3px",
      "--leaf-hot-y": "-4px",
      "--leaf-hot-rot": "1.6deg",
    },
  },
];

/** Pits in the stone's surface. */
export const STAY_PITS: readonly Leaf[] = [
  {
    id: "p1",
    style: {
      left: "30%",
      top: "64%",
      width: "5px",
      height: "4px",
      background: "rgba(96,84,66,.5)",
      filter: "blur(1px)",
    },
  },
  {
    id: "p2",
    style: {
      left: "66%",
      top: "34%",
      width: "7px",
      height: "5px",
      background: "rgba(104,92,72,.4)",
      filter: "blur(1.4px)",
    },
  },
];

/* ---------------------------------------------------------------------- */
/* Sakura branch                                                          */
/* ---------------------------------------------------------------------- */

export interface Branch {
  readonly id: string;
  readonly d: string;
  readonly stroke: string;
  readonly width: number;
  readonly dur: string;
  readonly delay: string;
}

export const STAY_BRANCHES: readonly Branch[] = [
  {
    id: "b1",
    d: "M562 34 C476 96 424 168 380 244 C348 300 328 352 318 402",
    stroke: "#231b17",
    width: 7,
    dur: "1.5s",
    delay: "0.55s",
  },
  { id: "b2", d: "M424 168 C404 214 396 250 384 294", stroke: "#241c18", width: 4, dur: "1.3s", delay: "0.8s" },
  { id: "b3", d: "M380 244 C428 288 462 322 486 372", stroke: "#221a16", width: 3.4, dur: "1.3s", delay: "0.92s" },
  { id: "b4", d: "M476 96 C506 148 520 196 524 246", stroke: "#201915", width: 3, dur: "1.2s", delay: "1s" },
  { id: "b5", d: "M318 402 C300 430 292 452 290 476", stroke: "#1f1814", width: 2.6, dur: "1.2s", delay: "1.08s" },
];

export const MOBILE_BRANCHES: readonly Branch[] = [
  {
    id: "mb1",
    d: "M392 6 C320 52 268 104 232 158 C208 194 194 224 188 254",
    stroke: "#231b17",
    width: 6,
    dur: "1.5s",
    delay: "0.55s",
  },
  { id: "mb2", d: "M268 104 C252 142 244 168 236 198", stroke: "#241c18", width: 3.4, dur: "1.3s", delay: "0.8s" },
  { id: "mb3", d: "M232 158 C272 190 300 214 318 250", stroke: "#221a16", width: 3, dur: "1.3s", delay: "0.92s" },
];

/** A five-petal blossom sitting on a branch node. */
export interface Blossom {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly rotate: number;
  readonly fills: readonly string[];
  readonly soft?: boolean;
}

export const STAY_BLOSSOMS: readonly Blossom[] = [
  {
    id: "bl1",
    x: 380,
    y: 244,
    scale: 1,
    rotate: 0,
    fills: ["#f3dcdd", "#eec7cb", "#f3dcdd", "#e8bcc2", "#f0d2d5"],
  },
  {
    id: "bl2",
    x: 424,
    y: 168,
    scale: 0.86,
    rotate: 30,
    fills: ["#f0d4d6", "#e9c1c6", "#f3dcdd", "#e6bcc1", "#eecfd2"],
  },
  {
    id: "bl3",
    x: 486,
    y: 372,
    scale: 0.94,
    rotate: 12,
    fills: ["#f2d8da", "#e7bfc4", "#f3dcdd", "#e9c3c8", "#efd1d4"],
  },
  { id: "bl4", x: 384, y: 294, scale: 0.7, rotate: 20, fills: ["#e6c3c7", "#dbb4ba", "#e2bdc2"], soft: true },
  { id: "bl5", x: 524, y: 246, scale: 0.66, rotate: 50, fills: ["#e3c0c4", "#d8afb5", "#dfbabf"], soft: true },
];

export const MOBILE_BLOSSOMS: readonly Blossom[] = [
  {
    id: "mbl1",
    x: 232,
    y: 158,
    scale: 0.9,
    rotate: 0,
    fills: ["#f3dcdd", "#eec7cb", "#f3dcdd", "#e8bcc2", "#f0d2d5"],
  },
  {
    id: "mbl2",
    x: 268,
    y: 104,
    scale: 0.74,
    rotate: 30,
    fills: ["#f0d4d6", "#e9c1c6", "#f3dcdd", "#e6bcc1", "#eecfd2"],
  },
  { id: "mbl3", x: 318, y: 250, scale: 0.66, rotate: 20, fills: ["#e6c3c7", "#dbb4ba", "#e2bdc2"], soft: true },
];

/** Distant out-of-focus blossoms, drawn as soft discs. */
export const STAY_BOKEH: readonly { id: string; cx: number; cy: number; r: number; fill: string }[] = [
  { id: "k1", cx: 452, cy: 126, r: 7, fill: "#d9b3b8" },
  { id: "k2", cx: 336, cy: 352, r: 6, fill: "#d3aab0" },
  { id: "k3", cx: 506, cy: 300, r: 8, fill: "#cfa7ad" },
  { id: "k4", cx: 300, cy: 452, r: 6.5, fill: "#c9a0a7" },
  { id: "k5", cx: 418, cy: 86, r: 5.5, fill: "#d5adb3" },
];

/* ====================================================================== */
/* MOBILE                                                                 */
/* ====================================================================== */

export const MOBILE_QUICK_LAYERS: readonly SceneLayer[] = [
  {
    id: "mq-shard-1",
    enter: "shardL",
    dur: "1.4s",
    delay: "0.2s",
    style: {
      left: "-60px",
      top: "20px",
      width: "340px",
      height: "300px",
      clipPath: "polygon(0% 18%,54% 0%,100% 42%,82% 100%,0% 100%)",
      background: "linear-gradient(150deg,#111116,#08080b 68%)",
    },
  },
  {
    id: "mq-shard-2",
    enter: "shardL",
    dur: "1.4s",
    delay: "0.42s",
    style: {
      left: "130px",
      top: "-30px",
      width: "120px",
      height: "200px",
      clipPath: "polygon(44% 0%,100% 24%,70% 100%,0% 70%)",
      background: "linear-gradient(200deg,#14141b,#0a0a0e)",
    },
  },
  {
    id: "mq-glow",
    enter: "fade",
    dur: "1.8s",
    delay: "1.1s",
    style: {
      left: "-20px",
      bottom: "-40px",
      width: "280px",
      height: "180px",
      background: "radial-gradient(50% 50% at 40% 60%,rgba(154,20,34,.16),rgba(154,20,34,0) 70%)",
      filter: "blur(22px)",
    },
  },
];

export const MOBILE_QUICK_FOREGROUND: SceneLayer = {
  id: "mq-fore",
  enter: "shardL",
  dur: "1.4s",
  delay: "0.82s",
  style: {
    left: "-30px",
    bottom: "-30px",
    width: "300px",
    height: "180px",
    zIndex: 6,
    clipPath: "polygon(0% 36%,40% 2%,100% 46%,100% 100%,0% 100%)",
    background: "linear-gradient(160deg,#06060a,#030305)",
  },
};

export const MOBILE_QUICK_FRACTURES: readonly Fracture[] = [
  fracture("mf1", "10px", "88px", "170px", "26deg", "#c0182a", "55%", 0.5, "0 0 9px rgba(192,24,42,.45)"),
  fracture("mf2", "70px", "210px", "200px", "-16deg", "#a5121f", "60%", 0.42, "0 0 8px rgba(165,18,31,.4)"),
];

export const MOBILE_QUICK_INNER_FRACTURES: readonly Fracture[] = [
  fracture("mi1", "6%", "28%", "88%", "12deg", "#c0182a", "46%", 0.42),
  fracture("mi2", "2%", "70%", "70%", "-8deg", "#a1111e", "52%", 0.3),
];

export const MOBILE_STAY_LAYERS: readonly SceneLayer[] = [
  {
    id: "ms-glow-1",
    enter: "fade",
    dur: "1.8s",
    delay: "0.2s",
    style: {
      right: "-60px",
      top: "-40px",
      width: "340px",
      height: "300px",
      background: "radial-gradient(56% 52% at 62% 42%,#1b2119,rgba(27,33,25,0) 72%)",
      filter: "blur(26px)",
    },
  },
  {
    id: "ms-glow-2",
    enter: "fade",
    dur: "1.8s",
    delay: "0.42s",
    style: {
      right: "-40px",
      bottom: "-50px",
      width: "360px",
      height: "230px",
      background: "radial-gradient(50% 50% at 54% 60%,#202c1c,rgba(32,44,28,0) 70%)",
      filter: "blur(20px)",
    },
  },
  {
    id: "ms-stone",
    enter: "shardR",
    dur: "1.5s",
    delay: "0.55s",
    style: {
      left: "34px",
      bottom: "78px",
      width: "180px",
      height: "56px",
      borderRadius: "50%",
      background: "linear-gradient(180deg,#2b2823,#131310)",
      filter: "blur(2px)",
    },
  },
];

export const MOBILE_LEAVES: readonly Leaf[] = [
  {
    id: "ml1",
    style: {
      left: "150px",
      bottom: "76px",
      width: "84px",
      height: "34px",
      background: "linear-gradient(120deg,#2c3a26,#161d13)",
      filter: "blur(.8px)",
      transitionDuration: "1.3s",
      "--leaf-rot": "-16deg",
      "--leaf-hot-x": "3px",
      "--leaf-hot-y": "-4px",
      "--leaf-hot-rot": "1.6deg",
    },
  },
  {
    id: "ml2",
    style: {
      left: "22px",
      bottom: "24px",
      width: "130px",
      height: "48px",
      background: "linear-gradient(120deg,#1f2a1b,#0e130c)",
      filter: "blur(2.6px)",
      transitionDuration: "1.6s",
      "--leaf-rot": "6deg",
      "--leaf-hot-x": "-3px",
      "--leaf-hot-y": "-2px",
      "--leaf-hot-rot": "-1.4deg",
    },
  },
  {
    id: "ml3",
    style: {
      right: "20px",
      bottom: "52px",
      width: "96px",
      height: "38px",
      background: "linear-gradient(120deg,#26331f,#11170e)",
      filter: "blur(1.8px)",
      transitionDuration: "1.5s",
      "--leaf-rot": "-4deg",
      "--leaf-hot-x": "3px",
      "--leaf-hot-y": "-4px",
      "--leaf-hot-rot": "1.6deg",
    },
  },
];
