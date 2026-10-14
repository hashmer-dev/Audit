export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'online',
    app: 'Government of Pakistan Commercial Audit Department (CAP-AI)',
    version: '1.0.0',
    endpoints: [
      '/api/chat',
      '/api/audit/analyze',
      '/api/audit/editor-ai'
    ]
  });
}
