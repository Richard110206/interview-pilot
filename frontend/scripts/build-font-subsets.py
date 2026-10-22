"""Split official MiSans VF for browser on-demand loading; preserve glyph outlines."""
from pathlib import Path
from io import BytesIO
import json
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib import woff2
# Font outlines are unchanged; moderate Brotli compression avoids minutes per shard.
compress_original=woff2.brotli.compress
def fast_compress(data,**kwargs):
    kwargs['quality']=5
    return compress_original(data,**kwargs)
woff2.brotli.compress=fast_compress

root=Path(__file__).resolve().parents[1]
out=root/'public/fonts/misans'
def build(name,codes):
 font=TTFont(root/'public/fonts/MiSansVF.woff2');options=subset.Options();options.flavor='woff2'
 worker=subset.Subsetter(options=options);worker.populate(unicodes=codes);worker.subset(font);font.flavor='woff2';font.save(str(out/f'{name}.woff2'))
 return (out/f'{name}.woff2').stat().st_size

def main():
 raw=(root/'public/fonts/MiSansVF.woff2').read_bytes()
 all_codes=set(TTFont(BytesIO(raw)).getBestCmap())
 out.mkdir(exist_ok=True)
 if not (out/'ui.woff2').exists():
  ui=''.join(p.read_text(encoding='utf-8') for p in (root/'src').rglob('*') if p.suffix in ['.tsx','.ts','.css'])
  build('ui',({ord(c) for c in ui}|set(range(32,256)))&all_codes)
 core=set(TTFont(out/'ui.woff2').getBestCmap())
 common=set(range(0x3000,0x3040))|set(range(0xff00,0xfff0))|set(range(256,768))
 for high in range(0xa1,0xf8):
  for low in range(0xa1,0xff):
   try:common.add(ord(bytes([high,low]).decode('gb2312')))
   except UnicodeDecodeError:pass
 common=(common&all_codes)-core
 groups={'ui':core,'common':common,'rare':all_codes-core-common}
 sizes={'ui':(out/'ui.woff2').stat().st_size,'common':build('common',common),'rare':len(raw)}
 css=[];covered=set()
 for name,codes in groups.items():
  spans=[];ordered=sorted(codes)
  if ordered:
   start=end=ordered[0]
   for code in ordered[1:]:
    if code==end+1:end=code
    else:spans.append(f'U+{start:X}'+(f'-{end:X}' if end!=start else ''));start=end=code
   spans.append(f'U+{start:X}'+(f'-{end:X}' if end!=start else ''))
  ranges=','.join(spans);src='../MiSansVF.woff2' if name=='rare' else f'./{name}.woff2'
  css.append(f'@font-face{{font-family:"MiSans";font-style:normal;font-weight:100 900;font-display:swap;src:url("{src}") format("woff2");unicode-range:{ranges};}}');covered.update(codes)
 assert covered==all_codes
 (out/'font.css').write_text('\n'.join(css),encoding='utf-8')
 (out/'manifest.json').write_text(json.dumps({'originalBytes':len(raw),'initialUiBytes':sizes['ui'],'glyphCoverage':len(all_codes),'files':sizes},indent=2),encoding='utf-8')
 print(json.dumps({'originalBytes':len(raw),'initialUiBytes':sizes['ui'],'chunks':len(sizes),'coverageComplete':True}),flush=True)
 assert out.resolve().is_relative_to(root.resolve())
 for path in out.glob('u[0-9a-f][0-9a-f][0-9a-f][0-9a-f].woff2'):path.unlink()
if __name__=='__main__':main()
