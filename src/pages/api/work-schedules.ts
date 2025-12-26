import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Proxy to backend API
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/work-schedules`);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch work schedules" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
