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
const forwardingAddress = "https://c51b91864a1a.ngrok.io";

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
    const state = nonce();
    const redirectUri = forwardingAddress + "/auth/callback";
    const installUrl = `https://${shop}.myshopify.com/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=${accessMode}`;
    console.log(installUrl);
    console.log("state: " + state);
    res.setHeader("Set-Cookie", cookie.serialize("state", String(state)));
    res.redirect(installUrl);
  } else {
    return res.status(400).send("Missing shop param");
  }
});

app.get("/auth/callback", (req, res) => {
  const { nonce, hmac, hostname, state } = req.query;
  const cookies = cookie.parse(req.headers.cookie);
  const stateCookie = cookies.state;
  console.log(req.headers);
  console.log(stateCookie);
  if (state !== stateCookie) {
    return res.status(403).send("Request Origin cannot be verified");
  }
});

// https://kemeza-app.myshopify.com/admin/oauth/authorize?client_id=f35ce46dc6c1ef29c7583ac8c36cf8f0&scope=read_products,write_products&redirect_uri=https://c51b91864a1a.ngrok.io/auth/callback&state=160737476477700&grant_options[]=per-user
