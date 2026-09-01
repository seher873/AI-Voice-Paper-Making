const { createClient } = require("@supabase/supabase-js");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jdotlluwlelsvtysvkho.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_AkNEquAHcpQjGLG2iMXDUw_hl2bphaW"
);
(async () => {
  const t1 = await sb.from("schools").select("id, school_name, plan");
  console.log("=== SCHOOLS ===");
  console.log(t1.error ? "ERR: "+t1.error.message : JSON.stringify(t1.data));
  const t2 = await sb.from("student_fees").select("id, school_id, student_name, class_name, monthly_fee, session, is_active");
  console.log("=== STUDENT_FEES ===");
  console.log(t2.error ? "ERR: "+t2.error.message : JSON.stringify(t2.data));
  const t3 = await sb.from("fee_structures").select("id, school_id, class_name, amount");
  console.log("=== FEE_STRUCTURES ===");
  console.log(t3.error ? "ERR: "+t3.error.message : JSON.stringify(t3.data));
  const t4 = await sb.from("fee_payments").select("id, school_id, student_fee_id, month_label, status");
  console.log("=== FEE_PAYMENTS ===");
  console.log(t4.error ? "ERR: "+t4.error.message : JSON.stringify(t4.data));
})().finally(()=>process.exit(0));
