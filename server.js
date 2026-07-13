import express from "express";
import Stripe from "stripe";

const app = express();

app.use(express.json());

// Check environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.log("=== Environment Variables Available ===");
  console.log(Object.keys(process.env).sort());
  console.log("======================================");

  console.error("❌ STRIPE_SECRET_KEY environment variable is missing.");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

app.get("/", (req, res) => {
  res.send("Stripe MCP Server Online");
});

app.post("/mcp", async (req, res) => {
  try {
    const request = req.body;

    if (request.method === "tools/list") {
      return res.json({
        tools: [
          {
            name: "list_customers",
            description: "List recent Stripe customers"
          },
          {
            name: "monthly_revenue",
            description: "Calculate recent Stripe revenue"
          }
        ]
      });
    }

    if (request.method === "tools/call") {
      const tool = request.params?.name;

      if (tool === "list_customers") {
        const customers = await stripe.customers.list({
          limit: 10
        });

        return res.json({
          content: [
            {
              type: "text",
              text: JSON.stringify(customers.data, null, 2)
            }
          ]
        });
      }

      if (tool === "monthly_revenue") {
        const payments = await stripe.paymentIntents.list({
          limit: 100
        });

        let total = 0;

        for (const payment of payments.data) {
          if (payment.status === "succeeded") {
            total += payment.amount_received;
          }
        }

        return res.json({
          content: [
            {
              type: "text",
              text: `Revenue: $${(total / 100).toFixed(2)}`
            }
          ]
        });
      }
    }

    return res.status(400).json({
      error: "Unknown request"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Stripe MCP running on port ${PORT}`);
});
