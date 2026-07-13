import express from "express";
import Stripe from "stripe";

const app = express();

app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


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

      const tool = request.params.name;


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


        payments.data.forEach(payment => {

          if (payment.status === "succeeded") {
            total += payment.amount_received;
          }

        });


        return res.json({
          content: [
            {
              type: "text",
              text:
              `Revenue: $${(total / 100).toFixed(2)}`
            }
          ]
        });

      }

    }


    res.status(400).json({
      error: "Unknown request"
    });


  } catch(error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }

});


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {

  console.log(
    `Stripe MCP running on port ${PORT}`
  );

});
