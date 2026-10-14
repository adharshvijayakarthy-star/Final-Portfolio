import type { ProjectMedia } from "./types";

export type Certificate = {
  id: string;
  title: string;
  quickTitle: string;
  quickDetail: string;
  category: string;
  detail: string;
  source: string;
  issuer: string | null;
  date: string | null;
  link: string | null;
  image: ProjectMedia;
  placeholder: boolean;
};

/** Replace an image and its alt text here, then set placeholder to false.
 * Add issuer, date and link only when verified certificate information exists. */
export const certificates: readonly Certificate[] = [
  { id: "isso", title: "ISSO Nationals — Shot Put Bronze Medalist", quickTitle: "ISSO · Shot Put", quickDetail: "Bronze Medalist · ISSO Nationals", category: "ISSO · athletics", detail: "Shot Put Bronze Medalist at ISSO Nationals.", image: { src: "/assets/certificates/shot-put-isso-placeholder.svg", alt: "Temporary placeholder for the ISSO Nationals Shot Put certificate; original scan pending", width: 900, height: 1200 }, source: "User-provided achievement; no year, distance or age category supplied.", issuer: null, date: null, link: null, placeholder: true },
  { id: "guitar", title: "Grade 5 Guitar Practical", quickTitle: "Grade 5 Guitar Practical", quickDetail: "Temporary certificate image.", category: "Music · completed", detail: "Completed, with certificate. Original image to be added.", image: { src: "/assets/certificates/guitar-practical-placeholder.svg", alt: "Temporary placeholder for the Grade 5 Guitar Practical certificate", width: 900, height: 1200 }, source: "Reconstruction brief, Beyond Code. Certificate scan not supplied.", issuer: null, date: null, link: null, placeholder: true },
  { id: "theory", title: "Grade 5 Music Theory", quickTitle: "Grade 5 Music Theory", quickDetail: "Temporary certificate image.", category: "Music · completed", detail: "Completed, with certificate. Original image to be added.", image: { src: "/assets/certificates/music-theory-placeholder.svg", alt: "Temporary placeholder for the Grade 5 Music Theory certificate", width: 900, height: 1200 }, source: "Reconstruction brief, Beyond Code. Certificate scan not supplied.", issuer: null, date: null, link: null, placeholder: true },
];

export const certificatePlaceholderNotice = "Temporary placeholder · original certificate image pending";
