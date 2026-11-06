import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
const root='https://ta-alan-2665-gateway.azurewebsites.net';
const routes={productos:'/api/catalogo/productos',categorias:'/api/catalogo/categorias'};
const failures=new Rate('respuesta_invalida');
export const options={
 scenarios:{catalogo:{executor:'ramping-vus',startVUs:0,stages:[{duration:'1m',target:50},{duration:'5m',target:50},{duration:'30s',target:0}]}},
 summaryTrendStats:['avg','med','p(95)','max'],
 thresholds:{...Object.fromEntries(Object.keys(routes).map(n=>['http_req_duration{ruta:'+n+'}',['max>=0']])),...Object.fromEntries(Object.keys(routes).map(n=>['respuesta_invalida{ruta:'+n+'}',['rate>=0']])),...Object.fromEntries(Object.keys(routes).map(n=>['http_reqs{ruta:'+n+'}',['count>0']]))}
};
export function setup(){
 for(const path of Object.values(routes)){
   const r=http.get(root+path,{timeout:'15s',tags:{fase:'preflight'}});
   if(r.status!==200 || !Array.isArray(r.json())) throw Error('Ruta no apta: '+path+' HTTP '+r.status);
 }
}
export default function(){
 for(const [ruta,path] of Object.entries(routes)){
   const r=http.get(root+path,{timeout:'10s',tags:{ruta}});
   const ok=check(r,{ 'HTTP 200 y arreglo JSON': x=>{try{return x.status===200&&Array.isArray(x.json());}catch{return false;}} },{ruta});
   failures.add(!ok,{ruta});
 }
 sleep(2);
}
export function handleSummary(data){
 const byRoute=Object.fromEntries(Object.keys(routes).map(n=>{const m=k=>data.metrics[k+'{ruta:'+n+'}']?.values??{};return [n,{path:routes[n],avg_ms:m('http_req_duration').avg,p95_ms:m('http_req_duration')['p(95)'],requests:m('http_reqs').count,requests_per_s:m('http_reqs').rate,error_pct:100*m('respuesta_invalida').rate}];}));
 return {stdout:JSON.stringify({target:root,profile:'1m 0-50 VU, 5m 50 VU, 30s a 0 VU',executedAt:new Date().toISOString(),duration_ms:data.state?.testRunDurationMs,routes:byRoute,http_requests:data.metrics.http_reqs?.values,invalid_response_rate:data.metrics.respuesta_invalida?.values,rnf:'Pendiente de comparar con umbrales E1'},null,2)+'\n'};
}