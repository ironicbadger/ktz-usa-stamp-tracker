"""One-time import: python3 scripts/import-catalogue.py path/to/parks.json.
Only writes data/catalogue.json; never overwrites authored Markdown.
"""
import concurrent.futures,html,json,re,sys,urllib.request
from pathlib import Path
rows=json.load(open(sys.argv[1]))['parks']
merged={}
for row in rows:
 code=row['id'].lower()
 if code not in merged:merged[code]={**row,'states':list(row['states'])}
 else:merged[code]['states']=sorted(set(merged[code]['states']+row['states']))
def fetch(item):
 code,row=item;url=f'https://www.nps.gov/{code}/index.htm'
 result={'code':code,'title':row['name'],'states':row['states'],'designation':row['type'],'resources':{},'source':url}
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'StampBook catalogue import'}),timeout=20) as r:raw=r.read().decode();final=r.url
  title=re.search(r'<title>(.*?)</title>',raw,re.S)
  if not title or 'Page Not Found' in title[1]:raise ValueError('NPS page not found')
  state=re.search(r'__title__designation[^>]*>[^<]*[•·]\s*([A-Z]{2}(?:\s*,\s*[A-Z]{2})*)',raw)
  if state:result['states']=sorted(set(re.findall('[A-Z]{2}',state[1])))
  result['resources']['website']=final
  for kind,suffix in [('maps','planyourvisit/maps.htm'),('visit','planyourvisit/index.htm')]:
   if '/'+code+'/'+suffix in raw:result['resources'][kind]=f'https://www.nps.gov/{code}/{suffix}'
  result['verified']='2026-09-26'
 except Exception as e:result['import_note']=str(e)
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:result=list(pool.map(fetch,sorted(merged.items())))
Path('data/catalogue.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
print('Imported',len(result),'places; official metadata verified:',sum('verified'in p for p in result))
print('Unverified:',[(p['code'],p.get('import_note'))for p in result if 'verified'not in p])
