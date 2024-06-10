const fs = require("fs");

fs.writeFile("message.txt", "Hello from daniel", (err) => {
  if (err) throw err;
  console.log("file created");

  fs.readFile("message.txt", (err, data) => {
    if (err) throw err;
    console.log(data.toString());
  });
});
