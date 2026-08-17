export default function handler(req,res){
  const names=[
    'STRIPE_SECRET_KEY',
    'STRIPE_PRICE_INDIVIDUAL_MONTHLY',
    'STRIPE_PRICE_INDIVIDUAL_ANNUAL',
    'STRIPE_PRICE_FAMILY_MONTHLY',
    'STRIPE_PRICE_FAMILY_ANNUAL',
    'STRIPE_WEBHOOK_SECRET',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  const configured=Object.fromEntries(names.map(name=>[name,Boolean(process.env[name])]));
  const secretMode=process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')?'test':process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')?'live':'missing-or-unrecognized';
  res.status(200).json({ok:true,configured,secret_mode:secretMode});
}
