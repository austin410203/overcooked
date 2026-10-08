// Compress Blender exports (.assets-raw) into public/models with meshopt.
// Characters keep their node hierarchy (only meshopt), everything else is fully optimized.
import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync } from 'node:fs';
const src = '.assets-raw', dst = 'public/models';
mkdirSync(dst, { recursive: true });
for (const f of readdirSync(src).filter((f) => f.endsWith('.glb'))) {
  const args = f.startsWith('char_')
    ? ['gltf-transform', 'meshopt', `${src}/${f}`, `${dst}/${f}`]
    : ['gltf-transform', 'optimize', `${src}/${f}`, `${dst}/${f}`, '--compress', 'meshopt', '--texture-compress', 'false', '--simplify', 'false'];
  execFileSync('npx', args, { stdio: 'ignore' });
  console.log('optimized', f);
}
