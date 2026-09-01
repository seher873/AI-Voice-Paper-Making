const { createClient } = require("@supabase/supabase-js");
const sb = createClient(
  "https://jdotlluwlelsvtysvkho.supabase.co",
  "sb_publishable_AkNEquAHcpQjGLG2iMXDUw_hl2bphaW"
);
(async () => {
  const t = await sb.from("schools").select("*");
  console.log("=== SCHOOLS all cols ===");
  console.log(t.error ? "ERR: "+t.error.message : JSON.stringify(t.data));
})().finally(()=>process.exit(0));
