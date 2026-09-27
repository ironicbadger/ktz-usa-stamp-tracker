import {escape} from '../src/content.mjs';
import sanitizeHtml from 'sanitize-html';

const safeLink=value=>typeof value==='string'&&(/^(https?:|mailto:)/i.test(value)||value.startsWith('#')||(/^\/(?!\/)/.test(value)&&!value.includes('\\')));
const imagePath=value=>typeof value==='string'&&value.startsWith('/attachments/')&&!value.includes('..')&&!value.includes('\\');
const literal=value=>escape(value).replaceAll('[','&#91;').replaceAll(']','&#93;');
export function renderDocument(document){
 if(!document||document.type!=='doc'||!Array.isArray(document.content))throw Error('Invalid rich-text document');
 let count=0;
 function render(node,depth=0){
  if(++count>20000||depth>40)throw Error('Rich-text document is too large');
  if(!node||typeof node.type!=='string')throw Error('Invalid rich-text node');
  if(node.type==='text'){
   if(typeof node.text!=='string')throw Error('Invalid rich-text text');
   let text=literal(node.text);
   for(const mark of node.marks||[]){
    const tags={bold:'strong',italic:'em',strike:'s',underline:'u',code:'code'};
    if(tags[mark.type])text=`<${tags[mark.type]}>${text}</${tags[mark.type]}>`;
    else if(mark.type==='link'){
     if(!safeLink(mark.attrs?.href))throw Error('Links must use HTTP, HTTPS, mailto or a local page');
     text=`<a href="${escape(mark.attrs.href)}">${text}</a>`;
    }else throw Error(`Unsupported text style: ${mark.type}`);
   }
   return text;
  }
  const body=(node.content||[]).map(n=>render(n,depth+1)).join('');
  switch(node.type){
   case 'doc':return body;
   case 'paragraph':return `<p>${body}</p>`;
   case 'heading':{const level=Number(node.attrs?.level);if(!Number.isInteger(level)||level<1||level>6)throw Error('Invalid heading level');return `<h${level}>${body}</h${level}>`;}
   case 'bulletList':return `<ul>${body}</ul>`;
   case 'orderedList':return `<ol start="${Math.max(1,Number(node.attrs?.start)||1)}">${body}</ol>`;
   case 'listItem':return `<li>${body}</li>`;
   case 'blockquote':return `<blockquote>${body}</blockquote>`;
   case 'codeBlock':return `<pre><code>${body}</code></pre>`;
   case 'hardBreak':return '<br>';
   case 'horizontalRule':return '<hr>';
   case 'image':if(!imagePath(node.attrs?.src))throw Error('Use an uploaded image');return `<img src="${escape(node.attrs.src)}" alt="${escape(node.attrs.alt||'')}" title="${escape(node.attrs.title||'')}" loading="lazy">`;
   default:throw Error(`Unsupported rich-text element: ${node.type}`);
  }
 }
 return render(document);
}
export function normalizeDocument(doc){
 if(!doc||!doc.json)throw Error('The editor must provide a rich-text document');
 if(doc.version!==undefined&&doc.version!==1)throw Error('Unsupported rich-text document version');
 return {version:1,json:structuredClone(doc.json),html:renderDocument(doc.json)};
}
export function normalizeRichRecord(input){
 const record=structuredClone(input);
 if(record.prose){
  const about=record.prose.about?normalizeDocument(record.prose.about):null;
  const associations=record.prose.associations?normalizeDocument(record.prose.associations):null;
  if(!about)throw Error('About text is required in an editor document');
  record.prose={about,...(associations?{associations}:{})};
  const visible=html=>plainText(html).trim()||/<img\b/.test(html);
  record.body=(visible(about.html)?about.html:'')+(record.kind==='Places'&&associations&&visible(associations.html)?'\n\n## Associations\n\n'+associations.html:'');
 }
 for(const visit of record.data?.visits||[]){
  if(visit.notes_doc){visit.notes_doc=normalizeDocument(visit.notes_doc);visit.notes=visit.notes_doc.html;}
  for(const stamp of visit.stamps||[])if(stamp.notes_doc){stamp.notes_doc=normalizeDocument(stamp.notes_doc);stamp.notes=stamp.notes_doc.html;}
 }
 return record;
}
export const plainText=html=>sanitizeHtml(html||'',{allowedTags:[],allowedAttributes:{}});
