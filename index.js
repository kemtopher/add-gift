const dotenv = require("dotenv").config();
const express = require("express");
const app = express();
const crypto = require("crypto");
const cookie = require("cookie");
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
const forwardingAddress = process.env.NGROK_ADDRESS;
let cachedState = 425352345;
let accessCode;

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
    return res.status(403).send("Request Origin cannot be verified");
  }

  if (hostnameVerified === false) {
    return res.status(403).send("Shop origin can not be varified");
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
        let accessToken = res.access_token;

        const shopRequestUrl = `https://${shop}/admin/api/2020-10/products.json`;
        const requestHeaders = {
          "X-Shopify-Access-Token": accessToken,
        };
        request
          .get(shopRequestUrl, { headers: requestHeaders })
          .then((shopResponse) => {
            console.log(shopResponse);
            return shopResponse;
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.status(400).send("Required params missing");
  }
});

// console.log("MY PAYLOAD: " + payload);
// async function getToken(url = "", data = {}) {
//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });
//   console.log("EARLY RESPONSE: " + response.body);
//   return response.json();
// }

// getToken(accessTokenUrl, payload)
//   .then((res) => {
//     console.log("LOGGED RESPONSE: " + res);
//     return res.json();
//   })
//   .then((data) => {
//     console.log("LOGGED DATA: " + JSON.stringify(data));
//   })
//   .catch((err) => {
//     console.log("LOGGED ERROR: " + err);
//   });
