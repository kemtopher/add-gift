const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve({ user: "ed" });
  }, 2000);
});
