import express from "express";
import Stripe from "stripe";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const server = new McpServer({
  name: "JamJuice Stripe",
  version: "1.0.0"
});


server.tool(
  "list_customers",
  "List Stripe customers",
  {},
  async () => {
    const customers = await stripe.customers.list({
      limit: 10
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(customers.data, null, 2)
        }
      ]
    };
  }
);


server.tool(
  "monthly_revenue",
  "Get Stripe revenue for the current month",
  {},
  async () => {

    const start = Math.floor(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).getTime() / 1000
    );

    const charges = await stripe.charges.list({
      created: {
        gte: start
      },
      limit: 100
    });

    const total = charges.data.reduce(
      (sum, charge) => sum + charge.amount,
      0
    );

    return {
      content: [
        {
          type: "text",
          text: `Monthly revenue: $${(total / 100).toFixed(2)}`
        }
      ]
    };
  }
);


app.post("/mcp", async (req,res)=>{

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.on("close",()=>{
    transport.close();
  });

  await server.connect(transport);

  await transport.handleRequest(req,res,req.body);

});


app.get("/",(req,res)=>{
  res.send("JamJuice Stripe MCP Server Running");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
  console.log(`MCP server running on port ${PORT}`);
});
