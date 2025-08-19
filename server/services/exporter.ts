import { storage } from "../storage";
import papaparse from "papaparse";
import JSZip from "jszip";

async function exportToCsv() {
  const contestants = await storage.getContestants();
  const seasons = await storage.getAllSeasons();
  const franchises = await storage.getAllFranchises();
  const appearances = await storage.getAllAppearances();

  // Filter out any potential null or undefined values before parsing
  const validContestants = contestants.filter(c => c);
  const validSeasons = seasons.filter(s => s);
  const validFranchises = franchises.filter(f => f);
  const validAppearances = appearances.filter(a => a);

  const contestantsCsv = papaparse.unparse(validContestants);
  const seasonsCsv = papaparse.unparse(validSeasons);
  const franchisesCsv = papaparse.unparse(validFranchises);
  const appearancesCsv = papaparse.unparse(validAppearances);

  const zip = new JSZip();
  zip.file("contestants.csv", contestantsCsv);
  zip.file("seasons.csv", seasonsCsv);
  zip.file("franchises.csv", franchisesCsv);
  zip.file("appearances.csv", appearancesCsv);

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return zipBuffer;
}

export const exporter = {
  exportToCsv,
};
