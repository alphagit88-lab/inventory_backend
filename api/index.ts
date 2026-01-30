// Super simple test handler to verify Vercel works
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Simple test response
  return res.status(200).json({
    message: "Backend is working!",
    path: req.url,
    method: req.method,
    time: new Date().toISOString()
  });
}
