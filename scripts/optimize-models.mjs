import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  meshopt,
  prune,
  reorder,
  simplify,
  textureCompress,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const MODELS_DIR = path.join(ROOT_DIR, "assets", "models");
const OUT_DIR = path.join(ROOT_DIR, "assets", "models-optimized");

function collectGlbFiles(dir, baseDir = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectGlbFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".glb")) {
      results.push({
        fullPath,
        relPath: path.relative(baseDir, fullPath).split(path.sep).join("/"),
      });
    }
  }
  return results;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function optimizeModels() {
  if (!fs.existsSync(MODELS_DIR)) {
    throw new Error(`Khong tim thay thu muc models: ${MODELS_DIR}`);
  }

  await Promise.all([
    MeshoptDecoder.ready,
    MeshoptEncoder.ready,
    MeshoptSimplifier.ready,
  ]);

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });

  const files = collectGlbFiles(MODELS_DIR);
  if (files.length === 0) {
    console.log("Khong tim thay file .glb nao.");
    return { count: 0, totalBefore: 0, totalAfter: 0 };
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;
  const manifestFiles = [];

  for (const file of files) {
    const origBuf = fs.readFileSync(file.fullPath);
    const origSize = origBuf.length;
    totalBefore += origSize;

    const outPath = path.join(OUT_DIR, file.relPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    const isLow = file.relPath.startsWith("low/");
    const isHigh = file.relPath.startsWith("high/");

    try {
      const doc = await io.readBinary(new Uint8Array(origBuf));

      const transforms = [
        dedup(),
        prune(),
        textureCompress({
          encoder: sharp,
          targetFormat: "webp",
          resize: isLow ? [512, 512] : [1024, 1024],
          quality: isLow ? 78 : 82,
        }),
      ];

      // Chỉ simplify các model nặng (> 500 KB) và không phải bản low/
      if (!isLow && origSize > 500 * 1024) {
        transforms.push(
          simplify({
            simplifier: MeshoptSimplifier,
            ratio: isHigh ? 0.35 : 0.45,
            error: 0.002,
          })
        );
      }

      transforms.push(
        reorder({ encoder: MeshoptEncoder }),
        meshopt({ encoder: MeshoptEncoder, level: "medium" })
      );

      await doc.transform(...transforms);
      const outUint8 = await io.writeBinary(doc);

      if (outUint8.length < origSize) {
        fs.writeFileSync(outPath, Buffer.from(outUint8));
        totalAfter += outUint8.length;
        const pct = (((origSize - outUint8.length) / origSize) * 100).toFixed(1);
        console.log(
          `[OK] ${file.relPath}: ${formatBytes(origSize)} -> ${formatBytes(outUint8.length)} (-${pct}%)`
        );
      } else {
        fs.copyFileSync(file.fullPath, outPath);
        totalAfter += origSize;
        console.log(`[COPY] ${file.relPath}: giu nguyen (${formatBytes(origSize)})`);
      }
    } catch (err) {
      fs.copyFileSync(file.fullPath, outPath);
      totalAfter += origSize;
      console.warn(`[WARN] ${file.relPath}: loi khi toi uu (${err.message}), copy ban goc.`);
    }

    manifestFiles.push(file.relPath);
  }

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        count: manifestFiles.length,
        generatedAt: new Date().toISOString(),
        files: manifestFiles,
      },
      null,
      2
    ),
    "utf8"
  );

  const totalPct = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
  console.log(`\nHoan tat toi uu ${files.length} models vao assets/models-optimized/.`);
  console.log(
    `Tong dung luong: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)} (-${totalPct}%)`
  );

  return { count: files.length, totalBefore, totalAfter };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  optimizeModels().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
