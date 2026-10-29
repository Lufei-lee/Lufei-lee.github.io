// Run with Node; sharp is provided by Next.js. Originals remain unchanged.
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = process.cwd();
(async () => {
 const files = ['carina-nebula.png','profile-cosmo-cat.png','topics/wmap-timeline.jpg','topics/wmap-cmb.png','topics/large-scale-structure-illustris.webp','topics/dark-matter-dark-energy.webp','topics/pandax-20t.png','topics/dark-energy-equivalent-models.png','topics/mnist.png','topics/efficient-frontier.jpg'];
 const manifest = {};
 await fs.mkdir('public/optimized', {recursive:true});
 for (const file of files) {
  const input = path.join(root,'public',file);
  const meta = await sharp(input).metadata();
  const max = file.includes('profile-') ? 800 : file.includes('carina-') ? 1920 : 1600;
  const widths = [...new Set([480,960,Math.min(meta.width,max)].filter(w=>w<=Math.min(meta.width,max)))].sort((a,b)=>a-b);
  const variants = [];
  for (const width of widths) {
   const url = `/optimized/${path.parse(file).name}-${width}.webp`;
   await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:file.includes('carina-')||file.includes('profile-')?82:90}).toFile(path.join(root,'public',url));
   variants.push({src:url,width});
  }
  manifest['/'+file]={width:meta.width,height:meta.height,variants};
 }
 await fs.writeFile('src/lib/imageVariants.json',JSON.stringify(manifest,null,2)+'\n');
 await sharp('public/carina-nebula.png').resize(1200,630,{fit:'cover'}).jpeg({quality:85}).toFile('public/optimized/share.jpg');
})();
