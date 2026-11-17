'use strict';
const APP='https://app.v2gmidia.com.br';
const DB='https://ushccxpoxjikzqnwhgfd.supabase.co';
function oficial(env=process.env) {
  return env.VERCEL==='1'&&env.VERCEL_ENV==='production'&&env.VERCEL_PROJECT_ID==='prj_FHsEozmi5MzDZfPwT6bggpRYprLO'
    &&env.SUPABASE_URL===DB&&env.V2G_COMMERCIAL_PRODUCTION_ENTRY_V1_ENABLED==='1'
    &&env.V2G_COMMERCIAL_WEBAPP_ENTRY_URL===APP+'/api/comercial/entrada'&&env.LEADS_SIMULAR!=='1';
}
function configuracaoPublica(env=process.env) {
  if(!oficial(env))return {enabled:true};
  const checkoutEnabled=env.V2G_COMMERCIAL_PUBLIC_PURCHASE_ENABLED==='1';
  return {enabled:true,environment:'production',checkoutEnabled,...(checkoutEnabled?{checkoutUrl:APP+'/contratar'}:{})};
}
module.exports={oficial,configuracaoPublica};
