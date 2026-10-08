// Writes src/scene/modelData.gen.ts with every GLB as a data URL (for single-bundle builds).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const out = readdirSync('public/models').filter((f) => f.endsWith('.glb')).map((f) =>
  `  ${JSON.stringify(f.replace('.glb', ''))}: 'data:model/gltf-binary;base64,${readFileSync('public/models/' + f).toString('base64')}',`);
writeFileSync('src/scene/modelData.gen.ts', `export const MODEL_DATA: Record<string, string> = {\n${out.join('\n')}\n};\n`);
