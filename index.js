require("dotenv").config();
const express = require("express");
const app = express();
const crypto = require("crypto");
const nonce = require("nonce")();
const querystring = require("querystring");
const { response } = require("express");
// require("isomorphic-fetch");
const request = require("request-promise");
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = "read_products,write_products";
// leave access mode blank for background tasks
const accessMode = "per-user";
const forwardingAddress = process.env.APP_URL;
let cachedState = 425352345;
let accessCode;
let accessToken;
let shop = "kemeza-app.myshopify.com";

app.get("/", (req, res) => {
  //  this is just a test request to retrieve all products from specific store via Admin API.
  //   if(!accessToken) {
  //     get a new token for the current session?
  //   }
  // const shopRequestUrl = `https://${shop}/admin/api/2020-10/products.json`;
  // const requestHeaders = {
  //   "X-Shopify-Access-Token": accessToken,
  // };
  // request
  //   .get(shopRequestUrl, { headers: requestHeaders })
  //   .then((shopResponse) => {
  //     console.log(shopResponse);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  res.send("main page");
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
    res.redirect(installUrl);
  } else {
    return res.status(400).send("Missing shop param");
  }
});

app.get("/auth/callback", (req, res) => {
  const { hmac, shop } = req.query;
  const stateToNum = Number(req.query.state);
  const stateCookie = cachedState;
  const regEx = new RegExp(/[a-zA-Z0-9][a-zA-Z0-9-]*.myshopify.com[/]?/);
  const hostnameVerified = regEx.test(shop);

  if (stateToNum !== stateCookie) {
    return res.status(403).send("Request origin cannot be verified");
  }

  if (hostnameVerified === false) {
    return res.status(403).send("Shop origin can not be verified");
  }

  if (hmac && shop) {
    const map = Object.assign({}, req.query);
    delete map["hmac"];
    const message = querystring.stringify(map);
    const hash = crypto
      .createHmac("sha256", apiSecret)
      .update(message)
      .digest("hex");

    if (hash !== hmac) {
      return res.status(400).send("HMAC validations failed");
    }

    accessCode = map.code;
    const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;

    const payload = {
      client_secret: apiSecret,
      client_id: apiKey,
      code: accessCode,
    };

    request
      .post(accessTokenUrl, { json: payload })
      .then((res) => {
        accessToken = res.access_token;
        const newUrl = forwardingAddress;
        res.status(200).redirect(newUrl);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.status(400).send("Required params missing");
  }
});

app.get("/app", (req, res) => {
  res.send("app endpoint");
});

app.get("/app/create-product", (req, res) => {
  res.send("safe at home");
});
