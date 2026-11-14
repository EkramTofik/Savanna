import type {Request,Response,Router} from 'express';
import path from 'node:path';import {createReadStream,promises as fs} from 'node:fs';

/**
 * Local context shape for this route.
 * `packRoot` — absolute path to the directory where pack sub-directories live.
 *   Each sub-directory is named by lesson id and must contain manifest.json + pack.zip.
 * `requireApiKey` — optional Express middleware that rejects requests lacking X-Savanna-Key.
 * Compatible with the shared Ctx (C7) because we only add optional fields.
 */
type Ctx={
  packRoot: string;
  requireApiKey?: (req:Request, res:Response, next:()=>void) => void;
  // Allow the shared Ctx fields to pass through without complaints
  prisma?: unknown;
  config?: { port:number; databaseUrl:string; redisUrl?:string };
};
const idOk=(s:string)=>/^[A-Za-z0-9_-]{1,80}$/.test(s);
function problem(res:Response,status:number,title:string,detail:string){return res.status(status).type('application/problem+json').json({type:'about:blank',title,status,detail});}
async function fileAt(root:string,id:string,name:string){const dir=path.resolve(root,id),f=path.resolve(dir,name);if(!f.startsWith(dir+path.sep))throw Error('bad path');await fs.access(f);return f;}
export function register(router:Router,ctx:Ctx){if(!ctx?.packRoot)throw Error('ctx.packRoot is required');const guard=ctx.requireApiKey?[ctx.requireApiKey]:[];
router.get('/v1/lessons/:id/pack',...guard,async(req:Request,res:Response)=>{const id=String(req.params.id);if(!idOk(id))return problem(res,400,'Invalid lesson id','Unsupported lesson id.');try{return res.json(JSON.parse(await fs.readFile(await fileAt(ctx.packRoot,id,'manifest.json'),'utf8')));}catch{return problem(res,404,'Pack not found','No offline pack is published for this lesson.');}});
router.get('/v1/lessons/:id/pack.zip',...guard,async(req:Request,res:Response)=>{const id=String(req.params.id);if(!idOk(id))return problem(res,400,'Invalid lesson id','Unsupported lesson id.');try{const f=await fileAt(ctx.packRoot,id,'pack.zip'),st=await fs.stat(f),range=req.headers.range;res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Type','application/zip');res.setHeader('Content-Disposition',`attachment; filename="${id}-pack.zip"`);if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m)return problem(res,416,'Invalid range','Invalid byte range.');let start=m[1]?Number(m[1]):0,end=m[2]?Number(m[2]):st.size-1;if(start>=st.size||end<start)return problem(res,416,'Range not satisfiable','Range is outside the file.');end=Math.min(end,st.size-1);res.status(206);res.setHeader('Content-Range',`bytes ${start}-${end}/${st.size}`);res.setHeader('Content-Length',String(end-start+1));createReadStream(f,{start,end}).pipe(res);}else{res.setHeader('Content-Length',String(st.size));createReadStream(f).pipe(res);}}catch{return problem(res,404,'Pack not found','Offline ZIP is not available.');}});
}
