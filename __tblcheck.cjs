const { createClient } = require("@supabase/supabase-js");
const sb = createClient(
  "https://jdotlluwlelsvtysvkho.supabase.co",
  "sb_publishable_AkNEquAHcpQjGLG2iMXDUw_hl2bphaW"
);
(async () => {
  for (const tbl of ["student_fees","fee_structures","fee_payments","profiles","schools"]) {
    const t = await sb.from(tbl).select("*");
    console.log("###", tbl, "=> err:", t.error ? t.error.message : "none", "rows:", (t.data||[]).length);
    if (t.error) console.log("   detail:", t.error.details||t.error.hint||"");
  }
})().finally(()=>process.exit(0));
