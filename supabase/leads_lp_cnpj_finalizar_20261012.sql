-- Aplicar SOMENTE depois que a LP publicada enviar p_cnpj com a nova RPC
-- e um lead de teste confirmar a gravação. Exige autorização específica.
-- Remove a rota antiga que aceita pré-cadastro sem CNPJ.

begin;

drop function if exists public.inserir_lead_lp(
  text,text,text,text,text,text,text,text,boolean,boolean,
  text,text,text,text,text,text,text,text,text
);

commit;
