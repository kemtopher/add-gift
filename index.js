const dotenv = require("dotenv").config();
const express = require("express");
const app = express();
const crypto = require("crypto");
const cookie = require("cookie");
const nonce = require("nonce")();
const querystring = require("querystring");
const request = require("request");

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = "read_products,write_products";
// leave access mode blank for background tasks
const accessMode = "per-user";
const forwardingAddress = process.env.NGROK_ADDRESS;
let cachedState = 1234456789;

app.get("/", (req, res) => {
  // out to frontend???
  res.send("hello world");
});

app.listen(3000, () => {
  console.log("givit away givit away givit away now!");
});

// install link route ex. localhost:3000/auth?shop=my-store
app.get("/auth", (req, res) => {
  const shop = req.query.shop;
  if (shop) {
    cachedState = nonce();
    const redirectUri = forwardingAddress + "/auth/callback";
    const installUrl = `https://${shop}.myshopify.com/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${cachedState}&grant_options[]=${accessMode}`;
    console.log(installUrl);
    res.redirect(installUrl);
  } else {
    return res.status(400).send("Missing shop param");
  }
});

app.get("/auth/callback", (req, res) => {
  const { nonce, hmac, shop, state } = req.query;
  const stateToNum = Number(req.query.state);
  const stateCookie = cachedState;
  const regEx = new RegExp(/[a-zA-Z0-9][a-zA-Z0-9-]*.myshopify.com[/]?/);
  const hostnameVerified = regEx.test(shop);

  if (stateToNum !== stateCookie) {
    return res.status(403).send("Request Origin cannot be verified");
  }

  if (hostnameVerified === false) {
    return res.status(403).send("Shop origin can not be varified");
  } else {
    console.log(`regEx expression passed with: ${hostnameVerified}`);
  }

  if (hmac) {
    const map = Object.assign({}, req.query);
    delete map["hmac"];
    const message = querystring.stringify(map);
    console.log(`old message: ${message}`);
    const hash = crypto
      .createHmac("sha256", apiSecret)
      .update(message)
      .digest("hex");
    console.log(`hash   : ${hash}`);
    console.log(`hmac   : ${hmac}`);
    console.log(`new message: ${message}`);
    if (hash !== hmac) {
      return res.status(400).send("HMAC validations failed");
    } else {
      return res.status(200).send("HMAC validated");
    }
  }
});
